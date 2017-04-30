// sign with default (HMAC SHA256)
require('dotenv').config();
var jwt = require('jsonwebtoken');
var secret = process.env.SECRET || 'mySecret';
// console.log(secret);

function decodeToken(token) {
  var decodedToken = '';
  if (token) {
    token.split('.').forEach((e, i) => {
      if (i != 2) {
        decodedToken += new Buffer(e, 'base64').toString() + '.';
      }
    });
  }

  return decodedToken;
}
// console.log(new Buffer('Hello World!').toString('base64'));
// console.log(new Buffer('SGVsbG8gV29ybGQh', 'base64').toString());



var token1 = jwt.sign({
  foo: 'bar'
}, secret, {
  algorithm: 'HS256',
  expiresIn: 60
}, (err, token) => {
  if (err) {
    throw err;
  }
  console.log(token);
  console.log(decodeToken(token));
});

var token2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE0OTExODIzNjQsImV4cCI6MTQ5MTE4MjQyNH0.ZhwU3l6dUI53C4OFY5PcJnjIZapbWjdusDQfszIDQug';
jwt.verify(token2, secret, (err, payload) => {
  if (err) {
    // throw err;
  }
  setTimeout(() => {
    console.log(payload);
  }, 10000);

});
