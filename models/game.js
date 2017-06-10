const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const limits = require('../config').limits;

const gameSchema = Schema({
    crossword: {
        type: Schema.Types.ObjectId,
        ref: 'Crossword',
        required: true
    },
    player1: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    player2: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    letters: [{
        pos: {
            type: [Number],
            required: true
        },
        isPlayer1: {
            type: Boolean,
            default: true
        },
        isCertain: {
            type: Boolean,
            default: true
        },
        letter: {
            type: String,
            minlength: limits.LETTER_MIN_LENGTH,
            maxlength: limits.LETTER_MIN_LENGTH,
            default: ' '
        },
        date: {
            type: Date,
            required: true
        }
    }],
    messages: [{
        isPlayer1: {
            type: Boolean,
            required: true
        },
        date: {
            type: Date,
            required: true
        },
        text: {
            type: String,
            minlength: limits.MESSAGE_MIN_LENGTH,
            maxlength: limits.MESSAGE_MAX_LENGTH,
            required: true
        }
    }]
});

module.exports = mongoose.model('Game', gameSchema);
