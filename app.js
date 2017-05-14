require('dotenv').config();

const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const index = require('./routes/index');
const main = require('./routes/main');
// const users = require('./routes/users');

const hbs = require('hbs');
const helmet = require('helmet');
const mongoose = require('mongoose');
const expressValidator = require('express-validator');
const i18n = require('i18n');
const dbUrl = require('./config').dbUrl;

const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const jwtOptions = require('./config').jwtOptions;
const User = require('./models/user');
const isProduction = process.env.NODE_ENV === 'production';


i18n.configure({
    // setup some locales - other locales default to en silently
    locales: ['en', 'el'],

    // sets a custom cookie name to parse locale settings from
    // cookie: 'locale',

    // where to store json files - defaults to './locales'
    directory: __dirname + '/locales'
});


const app = express();

if (!process.env.DONTUSECOMPRESSION) {
    app.use(require('compression')());
}

app.use(helmet());

//Set up mongoose connection
mongoose.connect(dbUrl);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

hbs.registerPartials(__dirname + '/views/partials');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

if (!isProduction) {
    app.use(logger('dev'));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(expressValidator());
app.use(cookieParser());


app.use(i18n.init);


// register hbs helpers in res.locals' context which provides this.locale
hbs.registerHelper('__', function () {
    return i18n.__.apply(this, arguments);
});
// hbs.registerHelper('__n', function () {
//   return i18n.__n.apply(this, arguments);
// });

passport.use(new JwtStrategy(jwtOptions, function (jwt_payload, done) {
    User.findOne({
        _id: jwt_payload.uid
    }, 'username isAdmin', function (err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            done(null, user);
        } else {
            done(null, false);
        }
    });
}));


app.use(require('node-sass-middleware')({
    src: path.join(__dirname, 'src/stylesheets/scss'),
    dest: path.join(__dirname, 'public/stylesheets'),
    prefix: '/stylesheets', // Where prefix is at <link rel="stylesheets" href="prefix/style.css"/>
    outputStyle: 'compressed',
    indentedSyntax: false,
    sourceMap: false,
    debug: false
}));

app.use(express.static(path.join(__dirname, 'public')));
if (isProduction) {
    app.use('/javascripts', express.static(path.join(__dirname, 'dist/javascripts')));
} else {
    app.use('/javascripts', express.static(path.join(__dirname, 'src/javascripts')));
}

// Heroku redirect from http to https
app.use(function (req, res, next) {
    if (req.headers['x-forwarded-proto'] !== 'https' && isProduction) {
        return res.redirect(`https://${req.hostname}${req.url}`);
    }
    return next();
});

app.use('/', index);
app.use('/main', passport.authenticate('jwt', {
    session: false,
    failureRedirect: '/logout'
}), main);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
