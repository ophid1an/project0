var path = require('path');

module.exports = {
  entry: './public/javascripts/game-session.js',
  output: {
    filename: 'game-session.js',
    path: path.resolve(__dirname, 'dist/javascripts')
  }
};
