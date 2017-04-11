const validator = require('validator');

const LIMITS = {
  MIN_USERNAME_LENGTH: 4,
  MIN_PWD_LENGTH: 8
};


module.exports = (obj, src, callback) => {
  var info = [];

  if (src === 'register') {
    if (!obj.username) {
      info.push('Username field cannot be empty.');
    } else {
      if (obj.username.length < LIMITS.MIN_USERNAME_LENGTH) {
        info.push(`Username length must be equal or greater than ${LIMITS.MIN_USERNAME_LENGTH} characters.`);
      }
    }

    if (!obj.email) {
      info.push('E-mail field cannot be empty.');
    } else {
      if (!validator.isEmail(obj.email)) {
        info.push('Not a valid e-mail address.');
      }
    }

    if (!obj.pwd) {
      info.push('Password field cannot be empty.');
    } else {
      if (obj.pwd.length < LIMITS.MIN_PWD_LENGTH) {
        info.push(`Password length must be equal or greater than ${LIMITS.MIN_PWD_LENGTH} characters.`);
      } else {
        if (obj.pwd !== obj.pwdConfirm) {
          info.push('The passwords do not match.');
        }
      }
    }

    return callback(info);
  }

  if (src === 'login') {
    if (!obj.username) {
      info.push('Username field cannot be empty.');
    } else {
      if (obj.username.length < LIMITS.MIN_USERNAME_LENGTH) {
        info.push(`Username length must be equal or greater than ${LIMITS.MIN_USERNAME_LENGTH} characters.`);
      }
    }

    if (!obj.pwd) {
      info.push('Password field cannot be empty.');
    } else {
      if (obj.pwd.length < LIMITS.MIN_PWD_LENGTH) {
        info.push(`Password length must be equal or greater than ${LIMITS.MIN_PWD_LENGTH} characters.`);
      }
    }

    return callback(info);
  }


};
