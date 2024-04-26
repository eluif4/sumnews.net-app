const mongoose = require('mongoose');

const genreSchema = new mongoose.Schema({
    genreId: Number,
    genre: String,
}, { collection: 'genres'} );

const Genre = mongoose.model('Genre', genreSchema);
module.exports = Genre;