const https=require('https');
const path=require('path');
const fs=require('fs-extra');
const nodeZip=require('unzip');
const targz=require('tar.gz');

const zipUtils={
    zip:"zip",
    tar:"tar.gz"
}

const isPlatform=(sysPlatform, platform)=>{
    return sysPlatform===platform?true:false;
}
const getPlatform=(sysPlatform=process.platform)=>{
    const possiblePlatforms=[
        {
          geth:'win',
          node:'win32'
        },
        {
          geth:'linux',
          node:'linux'
        },
        {
          geth:'mac',
          node:'darwin'
        }
    ]
    const currPlatform=possiblePlatforms.filter((value, index)=>{
        return isPlatform(sysPlatform, value.node);
    });
    return currPlatform.length>0?currPlatform[0].geth:null;
}
const doesBinaryAlreadyExist=(userpath, cb)=>{
    const gethPath=path.join(userpath, 'geth');
    fs.mkdir(gethPath, (err, result)=>{cb(err, gethPath)});
}
const getHttp=(url, cb)=>{
    https.get(url, (res)=>{
        let rawData = '';
        res.on('data', (chunk) => rawData += chunk);
        res.on('end', () => {
            try{
                cb(null, JSON.parse(rawData));
            }catch(e){
                cb(e, null);
            }
            //.clients.Geth.platforms[myPlatform].x64.download;
        });
    });
}
const getGethPackage=(meta, gethFolder, cb)=>{
    fs.stat(gethFolder, (err, stats)=>{
        if (err) {
            return cb(err, null);
        }
        if (!stats.isDirectory()) {
            return cb("Not a directory", null);
        } 
        const archivePath=path.join(gethFolder, `myTmpGeth.${zipUtils[meta.type]}`); //downloaded from internet
        const archiveStream = fs.createWriteStream(archivePath);
        const request = https.get(meta.url, (response)=>{
            response.pipe(archiveStream);
            archiveStream.on('error', (err)=>{
                console.log(err);
            })
            archiveStream.on('finish', ()=>{
                archiveStream.close(()=>{
                    cb(null, archivePath);
                });  // close() is async, call cb after close completes.
            });
        }).on('error', (err)=>{
            fs.unlink(archivePath);
            fs.remove(gethFolder);
            cb(err, null);
        });
    });
}
const extractGethPackage=(meta, gethFolder, archivePath, cb)=>{
    if(meta.type==='zip'){
        const gethStream = fs.createReadStream(archivePath);
        const extArch=nodeZip.Extract({path:gethFolder}).on('error', (err)=>{
            cb(err, null);
        }).on('close', ()=>{
            cb(null, "done");
        })
        gethStream.on('error', (err)=>{
            cb(err, null);
        }).pipe(extArch);
    }
    else{
        targz().extract(archivePath, gethFolder, (err)=>{
            fs.remove(archivePath);
            err?cb(err, null):cb(null, "done");
        })
    }
}

const getBinaryFromExtract=(meta, gethFolder, cb)=>{
    const srcFile=path.normalize(path.join(gethFolder, meta.bin));
    const binaryName=path.basename(srcFile);
    const folderName=path.dirname(srcFile);
    const dstFile=path.join(gethFolder, binaryName);
    fs.copy(srcFile, dstFile, (err, result)=>{
        fs.remove(folderName);
        return err?cb(err, null):cb(null, dstFile);
    });
}

const gethJson="https://raw.githubusercontent.com/ethereum/mist/master/clientBinaries.json";
const GetGeth=(userpath, eventSender, cb)=>{
    const myPlatform=getPlatform();
    if(!myPlatform){
        return cb("Operating System not supported", null);
    }
    doesBinaryAlreadyExist(userpath, (err, fullFolder)=>{
        if(err&&!process.env.FORCE_GETH_UPDATE){
            fs.readdir(fullFolder, (err, files)=>{
                eventSender.send("info", "Launching Geth...");
                cb(null, path.join(fullFolder,files[0]));
            });
            return;
        }
        getHttp(gethJson, (err, data)=>{
            const firstTimeMessage="Setting up for first use: ";
            eventSender.send("info", `${firstTimeMessage} Binary Downloading...`);
            const metaResults=data.clients.Geth.platforms[myPlatform].x64.download;
            getGethPackage(metaResults, fullFolder, (err, archive)=>{
                eventSender.send("info", `${firstTimeMessage} Binary Extracting...`);
                return err?cb(err, fullFolder):extractGethPackage(metaResults, fullFolder, archive, (err, results)=>{
                    eventSender.send("info", "Launching Geth...");
                    return err?cb(err, fullFolder):getBinaryFromExtract(metaResults, fullFolder, cb);
                })
            });
        })
    })
}
exports.GetGeth=GetGeth;
if(process.env.NODE_ENV==='test'){
    exports.getPlatform=getPlatform;
    exports.getHttp=getHttp;
    exports.getGethPackage=getGethPackage;
    exports.extractGethPackage=extractGethPackage;
}
