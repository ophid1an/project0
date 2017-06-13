var path = require('path');

module.exports = {
    entry: {
        'game-session': './src/javascripts/game-session.js',
        'friends': './src/javascripts/friends.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist/javascripts'),
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: "babel-loader"
        }]
    }
};
