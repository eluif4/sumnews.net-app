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

    // User preferences
    preferences: {
        genres: [{
            name: { type: String, required: true },   // Genre name (e.g., "technology")
            clicks: { type: Number, default: 0 }     // Number of clicks initialized to 0
        }],
        sources: [{
            name: { type: String, required: true },   // Source name (e.g., "nytimes.com")
            clicks: { type: Number, default: 0 }     // Number of clicks initialized to 0
        }]
    }
}, { collection: 'users' });

const DailyRecap = mongoose.model('User', userSchema);
module.exports = DailyRecap;