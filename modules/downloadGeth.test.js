var assert = require('assert');
process.env.NODE_ENV = 'test';
var downloadGeth=require('./downloadGeth')
const fs = require("fs-extra");

afterAll(() => {
  fs.readdir('.', (err, files)=>{
    files.filter((val)=>{return val.startsWith('tmp');}).map((val)=>{
      fs.remove(val);
    });
  })
})

describe('#getPlatform', function() {
  var getPlatform=downloadGeth.getPlatform;
  //var getPlatform= downloadGeth.__get__("getPlatform");
  it('should return "win" if process.platform=="win32"', ()=>{
    expect(getPlatform('win32')).toEqual('win');
  });
  it('should return "linux" if process.platform=="linux"', ()=>{
    expect(getPlatform('linux')).toEqual('linux');
  });
  it('should return "mac" if process.platform=="darwin"', ()=>{
    expect(getPlatform('darwin')).toEqual('mac');
  });
  it('should return null if process.platform not in "win32,linux,darwin"', ()=>{
    expect(getPlatform("someunknownplatform")).toEqual(null);
  }); 
});
describe('#getHttp', function() {
  //var getHttp= downloadGeth.__get__("getHttp");
  var getHttp=downloadGeth.getHttp;
  it('should return no error if successful', (done)=>{
    getHttp('https://raw.githubusercontent.com/ethereum/mist/master/clientBinaries.json', (err, result)=>{
      expect(err).toEqual(null);
      done();
    })
    
  });
  it('should return err if unsuccessful', (done)=>{
    getHttp('https://developer.mozilla.org/en-US/', (err, result)=>{
      expect(result).toEqual(null);
      done()
    })
    
  });
});
describe('#getGethPackage', function() {
  var getGethPackage=downloadGeth.getGethPackage;
  it('should return that folder doesnt exist', (done)=>{
    const testFolder='tmpGetGethPackage';
    getGethPackage({url:'https://raw.githubusercontent.com/SkyPet/UnitTestHelpers/master/helloworld.txt.tar.gz', type:'tar'}, './'+testFolder, (err, result)=>{
      expect(err.toString()).toEqual(`Error: ENOENT: no such file or directory, stat './${testFolder}'`);
      done()
    })
  });
  it('should write to tar', (done)=>{
    const testFolder='tmpGetGethPackage1';
    fs.mkdir(testFolder, (err, result)=>{
      getGethPackage({url:'https://raw.githubusercontent.com/SkyPet/UnitTestHelpers/master/helloworld.txt.tar.gz', type:'tar'}, './'+testFolder, (err, archivePath)=>{
        expect(archivePath).toEqual(`${testFolder}/myTmpGeth.tar.gz`);
        fs.remove(testFolder);
        done();
      })
    });
    
  });
  it('should write to zip', (done)=>{
    const testFolder='tmpGetGethPackage2';
    fs.mkdir(testFolder, (err, result)=>{
      console.log(err);
      getGethPackage({url:'https://raw.githubusercontent.com/SkyPet/UnitTestHelpers/master/helloworld.txt.zip', type:'zip'}, './'+testFolder, (err, archivePath)=>{
        expect(archivePath).toEqual(`${testFolder}/myTmpGeth.zip`);
        fs.remove(testFolder);
        done();
      })
    });
    
  });
});


describe('#checkFolder', function() {
  var checkFolder=downloadGeth.checkFolder;
  var tmpSender={
    send:(var1, var2)=>{
    }
  }
  it('should return that files dont exist', (done)=>{
    const testFolder='tmpCheckFolder1';
    fs.mkdir(testFolder, (err, res)=>{
      checkFolder('./'+testFolder, tmpSender, (err, res)=>{
        //console.log(res);
        //expect("tobehere").toEqual("tobehere");done();
        fs.remove(testFolder);
        done(new Error("Shouldn't get here"))
      }, 
      ()=>{expect("tobehere").toEqual("tobehere");fs.remove(testFolder);done();}
      )
    })
  });
  it('should return the file created', (done)=>{
    const testFolder='tmpCheckFolder2';
    fs.mkdir(testFolder, (err, res)=>{
      fs.writeFile('./'+testFolder+'/myFile.txt', 'helloworld', (err)=>{
        console.log(err);
        checkFolder('./'+testFolder, tmpSender, (err, res)=>{
          expect(res).toEqual(testFolder+'/myFile.txt');
          fs.remove(testFolder);
          done();
        }, ()=>{fs.remove(testFolder);done(new Error("Shouldn't get here"));});//done(new Error("Shouldn't get here"))});
      });
    })
  });
});

describe('#extractGethPackage', function() {
  
  var getGethPackage=downloadGeth.getGethPackage;
  var extractGethPackage=downloadGeth.extractGethPackage;
  it('should extract tar', (done)=>{
    const tp='tar';
    const testFolder='tmpExtractGethPackage1';
    fs.mkdir(testFolder, (err, result)=>{
      getGethPackage({url:'https://raw.githubusercontent.com/SkyPet/UnitTestHelpers/master/helloworld.txt.tar.gz', type:tp}, './'+testFolder, (err, archivePath)=>{
        extractGethPackage({type:tp}, './'+testFolder, archivePath, (err, result)=>{
          fs.readFile('./'+testFolder+'/helloworld.txt', (err, data) => {
            expect(data.toString().trim()).toEqual("hello world");
            fs.remove(testFolder);
            done();
          });
        })
      })
    });
  });
  it('should extract zip', (done)=>{
    const tp='zip';
    const testFolder='tmpExtractGethPackage2';
    fs.mkdir(testFolder, (err, result)=>{
      console.log(err);
      getGethPackage({url:'https://raw.githubusercontent.com/SkyPet/UnitTestHelpers/master/helloworld.txt.zip', type:tp}, './'+testFolder, (err, archivePath)=>{
        extractGethPackage({type:tp}, './'+testFolder, archivePath, (err, result)=>{
          fs.readFile('./'+testFolder+'/helloworld.txt', (err, data) => {
            expect(data.toString().trim()).toEqual("hello world");
            fs.remove(testFolder);
            done();
          });
        })
      })
    });
  });


});

