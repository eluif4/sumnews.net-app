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
    fcmTokens: [{
        token: { type: String, required: true },
        platform: { type: String, enum: ['web', 'android', 'ios', 'unknow'], required: true },
        timestamp: { type: Date, required: true, default: () => new Date() } // Use a function for dynamic timestamps
    }],

    // User preferences
    preferences: {
        genres: [{
            name: { type: String, required: true },   // Genre name (e.g., "technology")
            clicks: { type: Number, default: 0 },     // Number of clicks initialized to 0
            percentage: { type: Number, default: 0 }  // Percentage of total clicks initialized to 0
        }],
        sources: [{
            name: { type: String, required: true },   // Source name (e.g., "nytimes.com")
            clicks: { type: Number, default: 0 },     // Number of clicks initialized to 0
            percentage: { type: Number, default: 0 }  // Percentage of total clicks initialized to 0
        }],
        totalGenreClicks: { type: Number, default: 0 },  // Track total clicks for genres
        totalSourceClicks: { type: Number, default: 0 }  // Track total clicks for sources
    }
}, { collection: 'users' });

const DailyRecap = mongoose.model('User', userSchema);
module.exports = DailyRecap;