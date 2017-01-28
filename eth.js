const Web3 = require('web3');
const os=require('os');
const child_process = require('child_process');
const uuid = require('node-uuid');

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
const datadir=getGethPath('geth/lightchaindata', testing);
//const gethCommand=process.platform === 'darwin'?`${__dirname}/geth-mac`:process.platform==='win32'?`${__dirname}/geth-windows`:`${__dirname}/geth`;
const gethCommand=process.platform === 'darwin'?`geth-mac`:process.platform==='win32'?`geth-windows`:`./geth`;
//make these automatically generated!!
const contractAddress='0x72c1bba9cabab4040c285159c8ea98fd36372858'; 
const abi=[{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getRevenue","outputs":[],"payable":true,"type":"function"},{"constant":true,"inputs":[{"name":"_petid","type":"bytes32"},{"name":"index","type":"uint256"}],"name":"getAttribute","outputs":[{"name":"","type":"uint256"},{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"costToAdd","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_petid","type":"bytes32"}],"name":"getNumberOfAttributes","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_petid","type":"bytes32"},{"name":"_attribute","type":"string"}],"name":"addAttribute","outputs":[],"payable":true,"type":"function"},{"inputs":[],"type":"constructor"},{"payable":false,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_petid","type":"bytes32"},{"indexed":false,"name":"_attribute","type":"string"}],"name":"attributeAdded","type":"event"}];


const getAttributes=(contract, hashId, cb)=>{
    contract.getNumberOfAttributes(hashId, (err, result)=>{
        var maxIndex=result.c[0];
        var searchResults=Array(maxIndex).fill(0).map((val, index)=>{
            return new Promise((resolve, reject)=>{
                contract.getAttribute(hashId, index, (err, result)=>{
                    resolve({value:result[1], timestamp:new Date(result[0].c[0]*1000)});
                });
            }).then((value)=>{
                return value;
            })
        });
        Promise.all(searchResults)
        .then(results => {
            cb(null, results);
        })
        .catch(e => {
            cb(e, null);
        });
    });
}
const getCost=(contract, cb)=>{
    contract.costToAdd((err, result)=>{
        return err?cb(err, null):cb(null, web3.fromWei(result).toString());
    });
}
const addAttribute=(password, message, hashId, contract, cb)=>{
    const msToKeepAccountUnlocked=3000;
    contract.costToAdd((err1, cost)=>{
        web3.eth.getBalance(web3.eth.defaultAccount, (err2, balance)=>{
            if(cost.greaterThan(balance)){
                return cb("Not enough Ether!", null);
            }
            web3.personal.unlockAccount(web3.eth.defaultAccount, password, msToKeepAccountUnlocked, (err3, arg)=>{
                return err3?cb("Incorrect Password", null):contract.addAttribute.sendTransaction(hashId, message,
                {value:cost, gas:3000000}, (err, results)=>{
                    return err?cb(err, null):cb(null, results);
                });
            });
        })
    });
}
const watchContract=(contract, hashId,  attributeCB, moneyCB)=>{
    contract.attributeAdded({_petid:hashId}, (error, result)=>{
        if(error){
            return cb(error, null);
        }
        getAttributes(contract, hashId, attributeCB);
        getMoneyInAccount(web3.eth.defaultAccount, moneyCB);
    });
}
const getContract=()=>{
    return web3.eth.contract(abi).at(contractAddress);
}
const checkPassword=(password, cb)=>{
    const msToKeepAccountUnlocked=1;
    web3.personal.unlockAccount(web3.eth.defaultAccount, password, msToKeepAccountUnlocked, (err, arg)=>{
        return err?cb(err, null):cb(null, arg);
    });
}
const createAccount=(password, cb)=>{
    web3.personal.newAccount(password, (err, arg)=>{
        return err?cb(err, null):cb(null, arg);
    })
}
const getAccounts=(cb)=>{
  web3.eth.getAccounts((err, result)=>{
    if(err||result.length===0){
       return cb(err||"error", null); 
    }
    else{
        web3.eth.defaultAccount=result[0];
        return cb(null, result[0]);
    }
  });
}
const getMoneyInAccount=(address, cb)=>{
    web3.eth.getBalance(address, (err, balance)=>{ 
        err?cb(err, null):cb(null, web3.fromWei(balance).toString());
    });
}
const getSync=(progressCB, endCB)=>{
    web3.eth.isSyncing((error, sync)=>{
        console.log(error);
        if(sync===true){
            console.log("syncing started");
        }
        else if(sync){
            var progress=100.0*(sync.currentBlock-sync.startingBlock)/(sync.highestBlock-sync.startingBlock);
            progressCB(progress);
        }
        else{
            console.log("sync complete");
            endCB();
        }
    });
}

const getEthereumStart=(cb, provider="http://localhost:8545")=>{
    var geth = child_process.spawn(gethCommand, ['--rpc', '--testnet', '--datadir='+getGethPath("", false), '--light', '--ipcpath='+ipcPath, '--rpcapi="db,eth,net,web3,personal,web3"']);
    
    const wrappedCallback=()=>{
        geth.stderr.removeAllListeners();
        web3.setProvider(new web3.providers.HttpProvider(provider));
        cb(geth);
    }   
    geth.stderr.on('data', wrappedCallback);
}

const closeGeth=(geth)=>{
    geth.kill();
}
exports.addAttribute=addAttribute;
exports.getAttributes=getAttributes;
exports.getEthereumStart=getEthereumStart;
exports.getSync=getSync;
exports.createAccount=createAccount;
exports.closeGeth=closeGeth;
exports.getAccounts=getAccounts;
exports.checkPassword=checkPassword;
exports.getMoneyInAccount=getMoneyInAccount;
exports.getContract=getContract;
exports.getCost=getCost;
exports.watchContract=watchContract;