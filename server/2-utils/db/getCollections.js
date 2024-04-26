const Article = require("../../4-models/articles")
const Country = require("../../4-models/countries")
const Genre = require("../../4-models/genres")
const Source = require("../../4-models/sources")

async function getAllSources() {
    return await Source.find().sort({ sourceId: 1 });
}

async function getAllGenres() {
    return await Genre.find().sort({ genreId: 1 })
}

module.exports = {
    getAllSources,
    getAllGenres
}