const mongoose = require('mongoose');

const eventsSchema = new mongoose.Schema({
    autoNum: Number, // Automatic numbering ascending
    eventUri: String, // Event uri of the specific event
    count: Number, // How many articles exist in this event (value from the api)
    // dateAdded: Date, // The date when the event was added to the DB
}, { collection: 'events'} );

const Article = mongoose.model('Event', eventsSchema);
module.exports = Article;