var assert = require('assert');
var rewire = require('rewire');
var downloadGeth=rewire('./downloadGeth')
describe('downloadGeth', function() {
  describe('getPlatform', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
});