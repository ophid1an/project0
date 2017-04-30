var path = require('path');

module.exports = {
  entry: './src/javascripts/game-session.js',
  output: {
    filename: 'game-session.js',
    path: path.resolve(__dirname, 'dist/javascripts')
  }
};
