var assert = require('assert');
var rewire = require('rewire');
var downloadGeth=rewire('./modules/downloadGeth')
const fs = require("fs-extra");
const testFolder='tmpTestFolder';
afterAll(() => {
  fs.remove(testFolder);
})
afterEach(() => {
  fs.remove(testFolder);
})
beforeEach(() => {
  fs.remove(testFolder);
})
describe('#getPlatform', function() {
  var getPlatform= downloadGeth.__get__("getPlatform");
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
  var getHttp= downloadGeth.__get__("getHttp");
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
  var getGethPackage= downloadGeth.__get__("getGethPackage");
  it('should return that folder doesnt exist', (done)=>{
    getGethPackage({url:'https://raw.githubusercontent.com/SkyPet/UnitTestHelpers/master/helloworld.txt.tar.gz', type:'tar'}, './'+testFolder, (err, result)=>{
      expect(err.toString()).toEqual("Error: ENOENT: no such file or directory, stat './tmpTestFolder'");
      done()
    })
  });
  it('should write to tar', (done)=>{
    fs.mkdir(testFolder, (err, result)=>{
      getGethPackage({url:'https://raw.githubusercontent.com/SkyPet/UnitTestHelpers/master/helloworld.txt.tar.gz', type:'tar'}, './'+testFolder, (err, archivePath)=>{
        expect(archivePath).toEqual(`${testFolder}/myTmpGeth.tar.gz`);
        done();
      })
    });
  });
  it('should write to zip', (done)=>{
    fs.mkdir(testFolder, (err, result)=>{
      console.log(err);
      getGethPackage({url:'https://raw.githubusercontent.com/SkyPet/UnitTestHelpers/master/helloworld.txt.zip', type:'zip'}, './'+testFolder, (err, archivePath)=>{
        expect(archivePath).toEqual(`${testFolder}/myTmpGeth.zip`);
        done();
      })
    });
  });
});


describe('#extractGethPackage', function() {
  var getGethPackage= downloadGeth.__get__("getGethPackage");
  var extractGethPackage= downloadGeth.__get__("extractGethPackage");
  it('should extract tar', (done)=>{
    const tp='tar';
    fs.mkdir(testFolder, (err, result)=>{
      getGethPackage({url:'https://raw.githubusercontent.com/SkyPet/UnitTestHelpers/master/helloworld.txt.tar.gz', type:tp}, './'+testFolder, (err, archivePath)=>{
        extractGethPackage({type:tp}, './'+testFolder, archivePath, (err, result)=>{
          fs.readFile('./'+testFolder+'/helloworld.txt', (err, data) => {
            expect(data.toString().trim()).toEqual("hello world");
            done();
          });
        })
      })
    });
  });
  it('should extract zip', (done)=>{
    const tp='zip';
    fs.mkdir(testFolder, (err, result)=>{
      console.log(err);
      getGethPackage({url:'https://raw.githubusercontent.com/SkyPet/UnitTestHelpers/master/helloworld.txt.zip', type:tp}, './'+testFolder, (err, archivePath)=>{
        extractGethPackage({type:tp}, './'+testFolder, archivePath, (err, result)=>{
          fs.readFile('./'+testFolder+'/helloworld.txt', (err, data) => {
            expect(data.toString().trim()).toEqual("hello world");
            done();
          });
        })
      })
    });
  });
});

