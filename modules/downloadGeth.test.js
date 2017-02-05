var assert = require('assert');
var rewire = require('rewire');
var downloadGeth=rewire('./modules/downloadGeth')
describe('downloadGeth', function() {
  describe('#getPlatform', function() {
    var getPlatform= downloadGeth.__get__("getPlatform");
    it('should return "win" if process.platform=="win32"', ()=>{
      expect(getPlatform('win32')).toEqual('win');
    });
    it('should return "linux" if process.platform=="linux"', ()=>{
      expect(getPlatform('linux')).toEqual('linux');
    });
    it('should return "mac" if process.platform=="darwin"', ()=>{
      expect(getPlatform('darwin')).toEqual('mac');;
    });
    it('should return null if process.platform not in "win32,linux,darwin"', ()=>{
      expect(getPlatform("someunknownplatform")).toEqual(null);
    });
  });
  describe('#getHttp', function() {
    var getHttp= downloadGeth.__get__("getHttp");
    it('should return no error if successful', ()=>{
      getHttp('https://raw.githubusercontent.com/ethereum/mist/master/clientBinaries.json', (err, result)=>{
        expect(err).toEqual(null);
      })
      
    });
    it('should return err if unsuccessful', ()=>{
      getHttp('https://developer.mozilla.org/en-US/', (err, result)=>{
        expect(result).toEqual(null);
      })
      
    });
  });
});
