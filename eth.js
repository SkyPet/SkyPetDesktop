const Web3 = require('web3');
const os=require('os');
const spawn = require('child_process').spawn;
const uuid = require('node-uuid');
const Config = require('electron-config');
const config = new Config();
const exec = require( 'child_process' ).exec;
var CryptoJS = require("crypto-js");
const url = require('url');
const path = require('path');
const testing=true;
const gethPath=process.env.gethPath?process.env.gethPath:os.homedir()+"/.ethereum/";
const gethLocations={
  production:gethPath,
  testing:gethPath+'testnet/'
};
var web3=new Web3();
const getGethPath=(fileName, isTest)=>{
  return (isTest?gethLocations.testing:gethLocations.production)+fileName;
}
const ipcPath=getGethPath('geth.ipc', testing);
const ethPath=getGethPath("", false);
const datadir='--datadir '+getGethPath('geth/lightchaindata', testing);
const gethCommand=process.platform === 'darwin'?'./geth-mac':process.platform==='win32'?'geth-windows':'./geth';
const contractAddress='0x72c1bba9cabab4040c285159c8ea98fd36372858'; //please chnage this back to 


const parseResults=(result)=>{ 
    //result is an object.  if data is encrypted, MUST have an "addedEncryption" key.
    try{ 
        const parsedResult=JSON.parse(result);
        return Object.keys(parsedResult).filter((val)=>{
            return val!=='addedEncryption';
        }).reduce((cumulator, key, index)=>{
            return {
                attributeText:index>0?cumulator.attributeText+', '+parsedResult[key]:parsedResult[key],
                attributeType:index>0?cumulator.attributeType+', '+key:key,
                isEncrypted:parsedResult.addedEncryption?true:false
            }  
        }, {attributeType:'', attributeText:'', isEncrypted:false})
    }catch(e){
        console.log(e);
        return {attributeType:"generic", attributeText:result, isEncrypted:false};
    }
}
const getAttributes=(contract, hashId, unHashedId, event)=>{
    contract.getNumberOfAttributes(hashId, (err, result)=>{
        var maxIndex=result.c[0];
        var searchResults=Array(maxIndex).fill(0).map((val, index)=>{
            return new Promise((resolve, reject)=>{
                contract.getAttribute(hashId, index, (err, result)=>{
                    const parsedResult=CryptoJS.AES.decrypt(result[1], unHashedId).toString(CryptoJS.enc.Utf8);
                    resolve(Object.assign(parseResults(parsedResult), {timestamp:new Date(result[0].c[0]*1000)}));
                });
            }).then((value)=>{
                return value;
            })
        });
        Promise.all(searchResults)
        .then(results => {
            event.sender.send('retrievedData',results);
        })
        .catch(e => {
            console.error(e);
        });
    });
}

export const addAttribute=(contract, message, hashId, unHashedId, event)=>{
    contract.costToAdd((err1, cost)=>{
        web3.eth.getBalance(web3.eth.defaultAccount, (err2, balance)=>{
            if(cost.greaterThan(balance)){
                event.sender.send('error',"Not enough Ether!");
                return;
            }
            contract.addAttribute.sendTransaction(hashId, CryptoJS.AES.encrypt(message, unHashedId).toString(),
            {value:cost, gas:3000000}, (err, results)=>{
                if(err){
                    console.log(err);
                }
                else{
                    console.log("at 76");
                    console.log(results);
                }
            });
            contract.attributeAdded({_petid:hashId}, (error, result)=>{
                if(error){
                    console.log(error);
                    return;
                }
                console.log("at 85");
                //console.log(result);
                getAttributes(contract, hashId, unHashedId, event);
                web3.eth.getBalance(web3.eth.defaultAccount, (err, balance)=>{ 
                    event.sender.send('moneyInAccount', web3.fromWei(balance).toString());
                });
            });
        })
    });
}
function runWeb3(event, cb){
    var abi =[{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getRevenue","outputs":[],"payable":true,"type":"function"},{"constant":true,"inputs":[{"name":"_petid","type":"bytes32"},{"name":"index","type":"uint256"}],"name":"getAttribute","outputs":[{"name":"","type":"uint256"},{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"costToAdd","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_petid","type":"bytes32"}],"name":"getNumberOfAttributes","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_petid","type":"bytes32"},{"name":"_attribute","type":"string"}],"name":"addAttribute","outputs":[],"payable":true,"type":"function"},{"inputs":[],"type":"constructor"},{"payable":false,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_petid","type":"bytes32"},{"indexed":false,"name":"_attribute","type":"string"}],"name":"attributeAdded","type":"event"}];
    console.log("got here at 83")
    web3.eth.getAccounts((err, result)=>{
        web3.eth.defaultAccount=result[0];
        var contract=web3.eth.contract(abi).at(contractAddress);
        event.sender.send('accounts', web3.eth.defaultAccount);
        event.sender.send('constractAddress', contractAddress);     

        web3.eth.getBalance(web3.eth.defaultAccount, (err, balance)=>{
            event.sender.send('moneyInAccount', web3.fromWei(balance).toString());
        });
        contract.costToAdd((err, result)=>{
            event.sender.send('cost',web3.fromWei(result).toString());
        })
        return cb?cb(contract):console.log("Contract Initiated");        
    });
}

export const runGeth=(password, event,  cb)=>{
  exec(gethCommand+' --exec "personal.unlockAccount(eth.accounts[0], \''+password+'\', 0)" attach ipc:'+ipcPath, (err, stdout, stderr)=>{
      stdout=stdout.trim();
      if(err||(stdout!=="true")){
          return console.log(err||stdout);
      }
      else{
          console.log("open");
          runWeb3(event, cb);
      }
  });
}
export const createAccount=(password, cb)=>{
    config.set('hasAccount', true);
    exec(gethCommand+' --exec "personal.newAccount('+password+')"', (err, stdout, stderr)=>{
        if(!err){
            config.set('hasAccount', true);
        }
        cb(err, stdout);
    });
}
export const checkAccount=()=>{
    return config.get('hasAccount');
}
const checkPswd=(event)=>{
  //const pswd=path.join(__dirname, passwordFileName);
  exec(gethCommand+' '+datadir+'  account list', (err, stdout, stderr)=>{
        if(err||!stdout){
            config.set('hasAccount', false);
        }
            /*var value=uuid.v1().replace(/-/g, "");
            
            fs.writeFile(pswd, value, (err)=>{
                if(err) {
                    return console.log(err);
                }
                //exec(gethCommand+' '+datadir+' --password '+passwordFileName+' account new', (err, stdout, stderr)=>{
                exec(gethCommand+' --exec "personal.newAccount("password")"', (err, stdout, stderr)=>{
                    if(err){
                        return console.log(err);
                    }
                    runGeth(value,event, ipcPath, web3, cb);
                });
            });
        }*/
        else{
            config.set('hasAccount', true);
            event.sender.send('hasAccount', "p");
            /*config.has('password', )
            fs.readFile(pswd, 'utf8', (err, data)=>{
                if(err){
                    return console.log(err);
                }
                runGeth(data, event, ipcPath, web3, cb);
            });*/
        }
        
    });
}
/*const getHeaders=(data)=>{
    const headerIndex=data.indexOf("headers");
    const numHeaders=data.substring(headerIndex-4, headerIndex).trim();
    //console.log(numHeaders);
    return numHeaders?parseFloat(numHeaders):100;

}*/
const getSync=(event, cb)=>{
    web3.eth.isSyncing((error, sync)=>{
        console.log(error);
        if(sync===true){
            //is done, ready to work
            console.log("syncing started");
        }
        else if(sync){
            var progress=100.0*(sync.currentBlock-sync.startingBlock)/(sync.highestBlock-sync.startingBlock);
            event.sender.send('sync', {currentProgress:progress, isSyncing:true});
            console.log(sync.startingBlock+", "+sync.currentBlock+", "+sync.highestBlock);
        }
        else{
            event.sender.send('sync', {currentProgress:100, isSyncing:false});
            console.log("sync complete");
            cb();
        }
    });
}
export const getIds=()=>{
    return {
        unHashedId:"MyId4",
        hashId:web3.sha3("MyId4")
    }
}
export const getEthereumStart=(event)=>{
    
    const geth = spawn(gethCommand, ['--rpc', '--testnet', '--datadir='+getGethPath("", false), '--light', '--ipcpath='+ipcPath]);

    var isFirst=true;
    geth.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    
    geth.stderr.on('data', (data) => {
        if(isFirst){
            checkPswd(event);
            web3.setProvider(new web3.providers.HttpProvider("http://localhost:8545"));
            getSync( event, ()=>{
                checkPswd( event);
                /*if(testing){
                    const Ids=getIds();
                    checkPswd(event);
                }
                else{
                    checkPswd( event);
                }*/
            })
            
            isFirst=false;
        }
    });

    geth.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });  
}