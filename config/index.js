// const ExtractJwt = require('passport-jwt').ExtractJwt;

exports.title = process.env.TITLE || 'TeamWord';

exports.author = process.env.AUTHOR || 'John';

exports.jwtOptions = {
    secretOrKey: process.env.JWT_SECRET || 'mySecret',
    issuer: exports.title,
    expiresIn: '7d',
    jwtFromRequest: function (req) {
        var token = null;
        if (req && req.cookies) {
            token = req.cookies.jwt;
        }
        return token;
    }
    //jwtFromRequest: ExtractJwt.fromAuthHeader()
};

exports.dbUrl = process.env.MONGODB_URI;

exports.limits = {
    COOKIES_AGE: 6 * 24 * 60 * 60 * 1000,
    PWD_MIN_LENGTH: 8,
    USERNAME_MIN_LENGTH: 4,
    USERNAME_MAX_LENGTH: 30,
    MESSAGE_MIN_LENGTH: 1,
    MESSAGE_MAX_LENGTH: 2500,
    LETTER_MIN_LENGTH: 1,
    CW_DIFFICULTIES: ['easy', 'medium', 'hard'],
    CW_LANGUAGES_SUPPORTED: {
        el: 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ',
        en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    },
    LOCALES: {
        en: {
            months: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
        },
        el: {
            months: ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαι', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ']
        }
    }
};
