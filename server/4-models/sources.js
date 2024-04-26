const mongoose = require('mongoose');

const sourcesSchema = new mongoose.Schema({
    sourceId: Number,
    source: String,
    countryId: Number,
    sourceName: String,
}, { collection: 'sources'} );

const Source = mongoose.model('Source', sourcesSchema);
module.exports = Source;