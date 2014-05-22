define(['underscore', 'lib/sha1'], function(_, CryptoJS) {

  var normalize = function(obj) {
    if (_.isArray(obj)) {
      return obj.map(function(x) {
        return normalize(x);
      });
    } else if (_.isObject(obj)) {
      var sortedKeys = _.keys(obj).sort();
      var newObj = {};
      sortedKeys.forEach(function(key) {
        newObj[key] = normalize(obj[key]);
      });
      return newObj;
    } else {
      return obj;
    }
  };

  var hash = function(obj) {
    var normalizedObject = normalize(obj);
    return CryptoJS.SHA1(JSON.stringify(normalizedObject)).toString(CryptoJS.enc.Hex);
  };

  return {
    normalize: normalize,
    hash: hash
  };

});
