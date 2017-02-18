const https=require('https');
const path=require('path');
const fs=require('fs-extra');
const nodeZip=require('extract-zip');
const targz=require('tar.gz');
const log=require('electron-log');
log.transports.file.level='info';
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
	log.info('Platform ', JSON.stringify(currPlatform[0]));
    return currPlatform.length>0?currPlatform[0].geth:null;
}
/**Creates path to {SkyPetDirectory}/geth if it doesn't already exist */
const doesBinaryAlreadyExist=(userpath, cb)=>{
    const gethPath=path.join(userpath, 'geth');
	log.info('Geth Path ', gethPath);
    fs.mkdir(gethPath, (err, result)=>{cb(err, gethPath)});
}
/**Get JSON from url.  If the result isn't json then it returns an error */
const getHttp=(url, cb)=>{
    https.get(url, (res)=>{
        let rawData = '';
        res.on('data', (chunk) => rawData += chunk);
        res.on('error', (err)=>{
            log.error(err);
            return cb(err, null);
        });
        res.on('end', () => {
			log.info('Http received from ', url);
            try{
                cb(null, JSON.parse(rawData));
            }catch(e){
                cb(e, null);
            }
        });
    });
}
/**Download archive from the url provided in the "meta" object and save it locally */
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
		log.info('Archive Path ', archivePath);
        const request = https.get(meta.url, (response)=>{
			log.info('Response parsed');
            response.pipe(archiveStream);
            archiveStream.on('error', (err)=>{
                log.error(err);
                console.log(err);
            })
            archiveStream.on('finish', ()=>{
                archiveStream.close(()=>{
                    cb(null, archivePath);
                }); 
            });
        }).on('error', (err)=>{
			log.error('Error downloading online archive ', err);
            fs.unlink(archivePath);
            fs.remove(gethFolder);
            cb(err, null);
        });
    });
}
const extractGethPackage=(meta, gethFolder, archivePath, cb)=>{
    if(meta.type==='zip'){
		log.info("Zip file")
		log.info("Location to extract ", gethFolder);
        nodeZip(archivePath, {dir:gethFolder}, (err)=>{
			fs.remove(archivePath);
			if(err){
				log.error('Zip extraction failed ', err);
				return cb(err, null);
			}
			log.info('Zip Extracted');
			cb(null, "done");
        });
    }
    else{
		log.info("Tar file");
        targz().extract(archivePath, gethFolder, (err)=>{
            fs.remove(archivePath);
			err?log.err('Tar extraction failed ', err):log.info('Tar extracted');
            err?cb(err, null):cb(null, "done");
        })
    }
}

const getBinaryFromExtract=(meta, gethFolder, cb)=>{
    const srcFile=path.normalize(path.join(gethFolder, meta.bin));
    const binaryName=path.basename(srcFile);
    const folderName=path.dirname(srcFile);
    const dstFile=path.join(gethFolder, binaryName);
	log.info('Source Extract ', srcFile);
	log.info('Destination ', dstFile);
    fs.copy(srcFile, dstFile, (err, result)=>{
		err?log.error(err):log.info("Binary Copied");
        fs.remove(folderName);
        return err?cb(err, null):cb(null, dstFile);
    });
}

const checkFolder=(fullFolder, eventSender, cb, onNoFile)=>{
    fs.readdir(fullFolder, (err, files)=>{
        console.log(err);
        if(files&&files.length===0||!files){
            log.info("Geth doesn't exist, continuing to download");
            onNoFile();
        }
        else{
            eventSender.send("info", "Launching Geth...");
            log.info("Geth already exists")
            log.info("Geth path ", fullFolder);
            log.info("Geth binary ", files[0]);
            cb(null, path.join(fullFolder,files[0]));
        }
    });
}

const gethJson="https://raw.githubusercontent.com/ethereum/mist/master/clientBinaries.json";
const GetGeth=(userpath, eventSender, cb)=>{
    const myPlatform=getPlatform();
    if(!myPlatform){
        return cb("Operating System not supported", null);
    }
    doesBinaryAlreadyExist(userpath, (err, fullFolder)=>{
        const wrapper=()=>{
            getHttp(gethJson, (err, data)=>{
                if(err){
                    log.error(err);
                    return cb(err, null);
                }
                const firstTimeMessage="Setting up for first use: ";
                eventSender.send("info", `${firstTimeMessage} Binary Downloading...`);
                log.info("Retreived json");
                const metaResults=data.clients.Geth.platforms[myPlatform].x64.download;
                log.info("Meta Results", JSON.stringify(metaResults));
                getGethPackage(metaResults, fullFolder, (err, archive)=>{
                    eventSender.send("info", `${firstTimeMessage} Binary Extracting...`);
                    return err?cb(err, fullFolder):extractGethPackage(metaResults, fullFolder, archive, (err, results)=>{
                        err?log.error(err):eventSender.send("info", "Launching Geth...");
                        return err?cb(err, null):getBinaryFromExtract(metaResults, fullFolder, cb);
                    });
                });
            });
        }
        err&&!process.env.FORCE_GETH_UPDATE?checkFolder(fullFolder, eventSender, cb, wrapper):cb(null, fullFolder);
    })
}
exports.GetGeth=GetGeth;
if(process.env.NODE_ENV==='test'){
    exports.getPlatform=getPlatform;
    exports.checkFolder=checkFolder;
    exports.getHttp=getHttp;
    exports.getGethPackage=getGethPackage;
    exports.extractGethPackage=extractGethPackage;
}
