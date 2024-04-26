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
    content: String,
    summarizedContent: String,
    imageUrl: String,
    uuid: String,
}, { collection: 'articles'} );

const Article = mongoose.model('Article', articleSchema);
module.exports = Article;