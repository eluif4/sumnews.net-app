const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: String,
    googleId: String,
    name: String,
    given_name: String,
    family_name: String,
    picture: String,
    createdDate: Date,
    bookmarks: Array,
}, { collection: 'users' });

const DailyRecap = mongoose.model('User', userSchema);
module.exports = DailyRecap;