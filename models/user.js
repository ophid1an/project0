const mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    limits = require('../config').limits,

    userSchema = Schema({
        username: {
            type: String,
            required: true,
            minlength: limits.USERNAME_MIN_LENGTH,
            maxlength: limits.USERNAME_MAX_LENGTH,
            unique: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        jti: {
            type: Date,
            default: Date.now
        },
        pwd: {
            type: String,
            required: true
        },
        forgotPwd: {
            expires: {
                type: Date,
                required: true
            },
            bytes: {
                type: String,
                required: true,
                minlength: limits.RANDOM_BYTES_NUM * 2,
                maxlength: limits.RANDOM_BYTES_NUM * 2
            }
        },
        locale: {
            type: String,
            enum: Object.keys(limits.LOCALES),
        },
        friends: [{
            friend: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            completedGames: {
                type: Number,
                min: 0,
                default: 0
            },
            lastCompleted: {
                type: Schema.Types.ObjectId,
                ref: 'Statistic',
            }
        }],
        outFriendReq: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }],
        incFriendReq: [{
            from: {
                type: Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            text: {
                type: String,
                minlength: limits.MESSAGE_MIN_LENGTH,
                maxlength: limits.MESSAGE_MAX_LENGTH,
                required: true
            }
        }],
        isAdmin: Boolean
    });



userSchema.statics.getFriends = function (userId, callback) {
    this
        .findOne({
            _id: userId
        }, {
            friends: 1
        })
        .populate('friends.friend', 'username email locale')
        .exec((err, user) => {
            if (err) {
                return callback(err);
            }
            return callback(null, user.friends.map(e => {
                return {
                    _id: e.friend._id,
                    username: e.friend.username,
                    email: e.friend.email,
                    locale: e.friend.locale || 'en'
                };
            }));
        });
};

module.exports = mongoose.model('User', userSchema);
