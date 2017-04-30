// const ExtractJwt = require('passport-jwt').ExtractJwt;

const cookiesOptions = {
    name: {
        jwt: 'jwt',
        game: 'game'
    },
    age: 6 * 24 * 60 * 60 * 1000
};

const jwtOptions = {
    secretOrKey: process.env.JWT_SECRET || 'mySecret',
    issuer: process.env.TITLE || 'TeamWord',
    expiresIn: '7d'
};

// jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
jwtOptions.jwtFromRequest = function (req) {
    var token = null;
    if (req && req.cookies) {
        token = req.cookies[cookiesOptions.name.jwt];
    }
    return token;
};

const dbUrl = process.env.MONGODB_URI;

const vars = {
    title: process.env.TITLE || 'TeamWord',
    author: process.env.AUTHOR || 'John'
};

const limits = {
    PWD_MIN_LENGTH: 8,
    USERNAME_MIN_LENGTH: 4,
    USERNAME_MAX_LENGTH: 30
};

module.exports = {
    cookiesOptions: cookiesOptions,
    jwtOptions: jwtOptions,
    dbUrl: dbUrl,
    vars: vars,
    limits: limits
};
