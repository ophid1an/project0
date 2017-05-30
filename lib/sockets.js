const inspect = require('util').inspect;

const opt = {
    showHidden: true,
    depth: null
};

exports.authenticate = (socket, next) => {
  console.log('sockets authenticate');
  console.log(`SRHC = ${socket.request.headers.cookie}`);
  console.log(`SRQ = ${socket.request._query.gid}`);
  next();
};


exports.connect = (socket) => {

    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on('letters msg', function (msg) {
        console.log('letters: ' + inspect(msg, opt));
    });

};
