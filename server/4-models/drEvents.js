const mongoose = require('mongoose');

// const drEventsSchema = new mongoose.Schema({
//     id: String, // Identifier
//     drUri: String, // Single 'event' uri (each drUri has the following structure ${article.source}-uuid > example: sumnews.net-d1995468-f39d-40e3-87ba-4aa1a992b7ed)
//     savedArticles: Number, // Total amount of article saved in the 'event'
//     dateCreated: Date,
// }, { collection: 'drEvents' });

const drEventsSchema = new mongoose.Schema({
    id: String,
    dateCreated: Date,
    imageUrl: String,
    title: String,
    summary: String,
    articleCount: Number,
    genre: String,
    minutesSaved: Number,
    eventUri: String
}, { collection: 'drEvents' })

const DrEvent = mongoose.model('drEvents', drEventsSchema);
module.exports = DrEvent;