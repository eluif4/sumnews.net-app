const path = require("path")
const { validationResult } = require('express-validator')
const DBUTILS = path.join(__dirname, '../../2-utils/db')
const DatabaseAccess = path.join(DBUTILS, "/databaseAccess.js")
const getCollections = path.join(DBUTILS, "/getCollections.js")
const { getArticlesFromDB, aggregate } = require(DatabaseAccess)
const { getAllSources, getAllGenres } = require(getCollections)

async function getArticlesController(req, res) {
    try {
        const filter = req.query.filter ? JSON.parse(req.query.filter) : {}
        const project = req.query.project ? JSON.parse(req.query.project) : {}
        const sort = req.query.sort ? JSON.parse(req.query.sort) : { datePublished: -1 }
        // const collation = req.query.collation ? JSON.parse(req.query.collation) : {}
        const skip = parseInt(req.query.skip) || 0
        const limit = parseInt(req.query.limit) || 5

        const articles = await getArticlesFromDB(filter, project, sort, /*collation,*/ skip, limit)
        res.send(articles)
    }
    catch (error) {
        console.error("Problem getting articles from DB... ", error)
        res.status(500).send("Internal Server Error");
    }
}

async function PostArticlesController(req, res) {
    try {
        const filter = req.body.filter ? req.body.filter : {}
        const project = req.body.project ? req.body.project : {}
        const sort = req.body.sort ? req.body.sort : { datePublished: -1 }
        // const collation = req.body.collation ? req.body.collation : {}
        const skip = parseInt(req.body.skip) || 0
        const limit = parseInt(req.body.limit) || 10

        const articles = await getArticlesFromDB(filter, project, sort, /*collation,*/ skip, limit)
        res.send(articles)
    }
    catch (error) {
        console.error("Problem getting articles from DB... ", error)
        res.status(500).send("Internal Server Error");
    }
}

async function getArticlesFromSearchController(req, res) {
    try {
        var search_query = validationResult(req)
        search_query = req.query.search_query.trim();
        // const search_query = sanitizeInput(req.query.search_query);
        const searchRegex = new RegExp(search_query, 'i');

        const filter = {
            $or: [
                { title: { $regex: searchRegex } },
                { source: { $regex: searchRegex } },
                { author: { $regex: searchRegex } },
                { genre: { $regex: searchRegex } },
            ]
        };

        const sort = { datePublished: -1 }
        const articles = await getArticlesFromDB(filter, {}, sort, 0, 10) //Change the last value to limit the amount of articles returned
        res.send(articles)
    }
    catch (error) {
        console.error("Problem getting articles... ", error)
        res.status(500).send("Internal Server Error");
    }
}

async function getSourcesController(req, res) {
    try {
        const sources = await getAllSources();
        res.send(sources)
    } catch (error) {
        console.error('Error getting sources in controller', error)
    }
}

async function getGenresController(req, res) {
    try {
        const genres = await getAllGenres();
        res.send(genres)
    } catch (error) {
        console.error('Error getting genres in controller', error)
    }
}

async function getEventArticlesController(req, res) {
    const eventUri = req.query.eventUri;
    const filter = { eventUri: eventUri };
    const articles = await getArticlesFromDB(filter, {}, { datePublished: -1 }, 0, 10);
    res.send(articles)
}

async function getArticlesFromEventController(req, res) {
    const eventUri = req.body.eventUri;
    const pipeline = [
        {
            $lookup:
            {
                from: "articles",
                localField: "eventUri",
                foreignField: "eventUri",
                as: "eventArticles",
            },
        },
        {
            $match:
            {
                eventUri: eventUri,
            },
        },
    ]
    const result = await aggregate('events', pipeline);
    return res.send(result);
}

module.exports = {
    getArticlesController,
    getArticlesFromSearchController,
    PostArticlesController,
    getSourcesController,
    getGenresController,
    getEventArticlesController,
    getArticlesFromEventController,
}