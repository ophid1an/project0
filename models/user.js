const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const limits = require('../config').limits;

const userSchema = Schema({
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
        .populate('friends.friend', 'username')
        .exec((err, user) => {
            if (err) {
                return callback(err);
            }
            return callback(null, user.friends.map(e => {
                return {
                    username: e.friend.username,
                    _id: e.friend._id,
                };
            }));
        });
};

module.exports = mongoose.model('User', userSchema);
