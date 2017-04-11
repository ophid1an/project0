const validator = require('validator');

module.exports = obj => {

  var sanitizedObj = {};
  for (let prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      sanitizedObj[prop] = validator.escape(obj[prop]);
    }
  }

  return sanitizedObj;

};
