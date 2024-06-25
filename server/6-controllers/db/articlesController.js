const path = require("path")
const { validationResult } = require('express-validator')
const { getEventByEventUri } = require("../../2-utils/db/databaseAccess")
const Article = require("../../4-models/articles")
const UTILS = path.join(__dirname, '../../2-utils')
const DBUTILS = path.join(__dirname, '../../2-utils/db')
const DatabaseAccess = path.join(DBUTILS, "/databaseAccess.js")
const GetCollections = path.join(DBUTILS, "/getCollections.js")
const { getArticlesFromDB, aggregate, getDailyRecap, getDailyRecapButtons, getSourcesLogo, BM25 } = require(DatabaseAccess)
const { getAllSources, getAllGenres } = require(GetCollections)
const DailyRecap = path.join(UTILS, "/dailyRecaps.js")
const { createDailyRecap } = require(DailyRecap)

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
        const infiniteScrollCallCount = parseInt(req.body.infiniteScrollCallCount ? req.body.infiniteScrollCallCount : 0) * 10;
        search_query = req.query.search_query.trim();

        const pipeline = [
            {
                $search: {
                    index: "default",
                    text: {
                        query: search_query,
                        path: {
                            wildcard: "*"
                        }
                    }
                }
            },
            {
                $skip: infiniteScrollCallCount
            },
            {
                $limit: 10
            }
        ]

        const articles = await BM25(pipeline);
        res.send(articles);
    }
    catch (error) {
        console.error("Failed at /search. Make sure you are in developement mode ", error)
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

async function getEventByEventUriController(req, res) {
    const eventUri = req.body.eventUri;
    const event = await getEventByEventUri(eventUri)
    res.send(event)
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
    return res.send(result[0]);
}

async function getArticlesFromDrEventController(req, res) {
    const drUri = req.body.drUri;
    const pipeline = [
        {
            $lookup:
            {
                from: "articles",
                localField: "drUri",
                foreignField: "drUri",
                as: "eventArticles",
            },
        },
        {
            $match:
            {
                drUri: drUri,
            },
        },
    ]
    const result = await aggregate('drEvents', pipeline);
    return res.send(result[0]);
}

async function createDailyRecapController(req, res) {
    const dr = await createDailyRecap()
    res.send(dr)
}

async function getDailyRecapByIdController(req, res) {
    const uuid = req.body.uuid;
    // var filter = { "id": uuid }
    const response = await getDailyRecap(uuid);
    const dr = response[0]
    res.send(dr)
}

async function getDailyRecapsController(req, res) {
    const uuid = req.body.uuid;
    var drs = await getDailyRecap(uuid);
    res.send(drs);
}

async function getDailyRecapButtonsController(req, res) {
    var drbs = await getDailyRecapButtons();
    res.send(drbs)
}

async function getSourcesLogoController(req, res) {
    const sources = req.body.sources;
    const sourcesLogo = await getSourcesLogo(sources);
    res.send(sourcesLogo);
}

module.exports = {
    getArticlesController,
    getArticlesFromSearchController,
    PostArticlesController,
    getSourcesController,
    getGenresController,
    getEventArticlesController,
    getEventByEventUriController,
    getArticlesFromEventController,
    getArticlesFromDrEventController,
    createDailyRecapController,
    getDailyRecapButtonsController,
    getDailyRecapByIdController,
    getDailyRecapsController,
    getSourcesLogoController,
}