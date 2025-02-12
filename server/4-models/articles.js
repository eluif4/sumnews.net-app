const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: String,
    url: String,
    source: String,
    author: Array,
    datePublished: {
        type: Date,
        get: (value) => value.toISOString()
    },
    genre: Array,
    eventUri: String,
    drUri: String,
    // content: String,
    articleCharCount: Number,
    summarizedContent: String,
    imageUrl: String,
    sentiment: Number,
    // concepts: Array,
    // links: Array,
    // shares: Object,
    uuid: {
        type: String,
        unique: true,
        required: true
    },
    engagements: {
        // Add type of engagements here
        clicks: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        },
        originalArticleReads: {
            type: Number,
            default: 0
        }
    }
}, { collection: 'articles' });

const Article = mongoose.model('Article', articleSchema);
module.exports = Article;