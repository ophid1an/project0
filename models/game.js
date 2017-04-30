const mongoose = require('mongoose');
// const limits = require('../config');
const Schema = mongoose.Schema;

const gameSchema = Schema({
    crossword: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crossword',
        required: true
    },
    player1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    player2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    letters: [{
        pos: {
            type: [Number],
            required: true
        },
        isPlayer1: {
            type: Boolean,
        },
        isCertain: {
            type: Boolean,
        },
        letter: {
            type: String,
        }
    }],
    messages: [{
        date: {
            type: Date,
            required: true
        },
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: true
        }
    }]
});

module.exports = mongoose.model('Game', gameSchema);
