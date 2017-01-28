const eth=require('./eth');
const getEthereumStart=eth.getEthereumStart;
const addAttribute=eth.addAttribute;
const getAttributes=eth.getAttributes;
//const getIds=eth.getIds;//this is temporary!!
const closeGeth=eth.closeGeth;
const checkAccount=eth.checkAccount;
const createAccount=eth.createAccount;
const getAccounts=eth.getAccounts;
const checkPassword=eth.checkPassword;
const getContract=eth.getContract;
const watchContract=eth.watchContract;
const getCost=eth.getCost;
const getMoneyInAccount=eth.getMoneyInAccount;
const getSync=eth.getSync;

const returnSuccessError=(event, err, result)=>{
    return err?event.sender.send("passwordError", err):event.sender.send("successLogin", result);
}
const SkyPetApi=(event)=>{
    let geth;
    let contract;
    //let hashId;
    //let unHashedId;
    const syncHelper=(event)=>{
        //const Ids=getIds();//testing only!
        //hashId=Ids.hashId;//testing only!
        //unHashedId=Ids.unHashedId;//testing only!
        contract=getContract(); 
        getAccounts((err, account)=>{
            if(!err){
                getMoneyInAccount(account, (err, balance)=>{
                    event.sender.send("moneyInAccount", balance);
                })
                event.sender.send("account", account);
                event.sender.send("sync", {currentProgress:100, isSyncing:false});
            }
        })
        getCost(contract, (err, result)=>{
            err?"":event.sender.send("cost", result);
        })
        /*BELOW THIS IS TEST ONLY!!! */
        /*hashId?event.sender.send("petId", hashId):"";//temporary*/
        /*getAttributes(contract, unHashedId, (err, result)=>{
            err?"":event.sender.send("retrievedData", result);
        })*/
    }
    //this doesn't work still
    const close=()=>{
        if(geth){
            closeGeth(geth);
        }
    }
    //let contract;
    //Dont expose this to the public.  Private only!
    event.on('startEthereum', (event, arg)=>{
        getEthereumStart((gethInstance)=>{
            geth=gethInstance;
            getSync((progress)=>{
                event.sender.send("sync", {currentProgress:progress, isSyncing:true});
            }, ()=>{
                syncHelper(event);
            })
        });
    })
    event.on('password', (event, arg)=>{
        getAccounts((err, result)=>{
            return err?createAccount(arg, (err, result)=>{
                returnSuccessError(event, err, result);
            }):checkPassword(arg, (err, result)=>{
                returnSuccessError(event, err, result);
            })
        });
    })
    event.on('addAttribute', (event, arg) => {
        contract?addAttribute(arg.password,arg.message, arg.hashId, contract, (err, result)=>{
            err?"":event.sender.send("attributeAdded", true);
        }):"";
    });
    event.on('id', (event, hashId)=>{
        //event.sender.send("petId", hashId);
        contract?getAttributes(contract, hashId,  (err, attributes)=>{
            err?"":event.sender.send("retrievedData", attributes);
        }):"";
        contract?watchContract(contract, hashId,  (err, attributes)=>{
            err?"":event.sender.send("retrievedData", attributes);
        }, (err, balance)=>{
            err?"":event.sender.send("moneyInAccount", balance);
        }):"";
    });
    event.on('getAttributes', (event, hashId) => {
        contract?getAttributes(contract, hashId, (err, result)=>{
            err?"":event.sender.send("retrievedData", result);
        }):"";
    });
    
}
exports.SkyPetApi=SkyPetApi;