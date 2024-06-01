const mongoose = require('mongoose');

const eventsSchema = new mongoose.Schema({
    eventUri: String, // Event uri of the specific event
    articlesCount: Number,
    articlesSaved: Number, // How many articles exist in this event (value from the api)
    dateCreated: Date, // The date when the event was added to the DB
    socialScore: Number,
    sentiment: Number,
    summary: Object,
    concepts: Array,
    
}, { collection: 'events' });

const Event = mongoose.model('Event', eventsSchema);
module.exports = Event;