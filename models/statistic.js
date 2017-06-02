const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const limits = require('../config').limits;

const StatisticSchema = Schema({
    dateStarted: {
        type: Date,
        required: true
    },
    diff: {
        type: String,
        enum: limits.CW_DIFFICULTIES,
        required: true,
    },
    whitesC: {
        type: Number,
        min: 1,
        required: true
    },
    player1: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    p1Letters: {
        type: Number,
        min: 0,
        required: true
    },
    player2: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    p2Letters: {
        type: Number,
        min: 0
    }
});

module.exports = mongoose.model('Statistic', StatisticSchema);
