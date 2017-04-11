const crypto = require('crypto');
const bytesNum = 256;

crypto.randomBytes(bytesNum, (err, buf) => {
  if (err) throw err;
  console.log(`${buf.length} bytes of random data: ${buf.toString('hex')}`);
});
