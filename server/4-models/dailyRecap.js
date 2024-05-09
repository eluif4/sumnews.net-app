const mongoose = require('mongoose');

const dailyRecapSchema = new mongoose.Schema({
    id: String,
    events: Array, // 5 Different events that are in the daily recap. These events also have all the articles inside them
    dateCreated: Date,
}, { collection: 'dailyrecaps' });

const DailyRecap = mongoose.model('DailyRecaps', dailyRecapSchema);
module.exports = DailyRecap;