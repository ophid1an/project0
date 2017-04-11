const validator = require('validator');

module.exports = obj => {

  var unSanitizedObj = {};
  for (let prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      unSanitizedObj[prop] = validator.unescape(obj[prop]);
    }
  }

  return unSanitizedObj;

};
