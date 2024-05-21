const Article = require("../../4-models/articles")
// const User = require("../../4-models/users")
const Source = require('../../4-models/sources')
const Event = require('../../4-models/events')

// const { MongoClient } = require('mongodb')
const { mongoose } = require('../../config/dbconfig')
const { handleError } = require('../../3-middleware/errorHandler')
const kleur = require('kleur')
const DailyRecap = require("../../4-models/dailyRecap")

const db = mongoose.connection;

// ----- ARTICLES -----
async function saveToDB(article) { //SAVES THE GIVEN ARTICLE TO DB WITH ALL RELEVANT METADATA ABOUT IT
    console.log(kleur.bold(`Saving article...`))

    // await client.connect();
    const collection = db.collection('articles')
    try {
        await collection.insertOne(article)
    } catch (error) {
        handleError(error, `Coulnd't save article to db`)
    }
}

async function saveDocument(document) {
    // console.log(kleur.bold(`Saving ${document.collection.modelName} into '${document.collection.name}' collection`));

    // await client.connect();
    const collection = db.collection(document.collection.name);
    await collection.insertOne(document);
    console.log(`Document saved to '${document.collection.name}' collection`)
}

async function getArticlesFromDB(filter, project, sort, /*collation,*/ skip, limit) {
    //GETS ARTICLES FROM DB ACCORDING TO PARAMS
    try {
        return await Article.find(filter, project).sort(sort)./*collation(collation).*/skip(skip).limit(limit)
    } catch (error) {
        console.error(`Couldn't get articles from db`, error)
    }
}

async function doesArticleExist(article) {
    const articles = await getArticlesFromDB({ "url": article.url })
    return articles.length > 0
}

async function articlesSinceYesterday() {
    // Tomorrow's date 
    // (Therefore allowing to search between yesterday (inclusive) and tomorrow (exclusive) = yesterday and today)
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const todayFormatted = today.toISOString().slice(0, 10) + 'T00:00:00Z';

    // Yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = yesterday.toISOString().slice(0, 10) + 'T00:00:00Z';

    var articles = [];
    try {
        // var query = {
        //     "datePublished": {
        //         "$gte": yesterdayFormatted,
        //         "$lt": todayFormatted
        //     }
        // };

        // var options = {
        //     sort: {"datePublished": -1},
        //     projection: {_id: 1, url: 1}
        // };

        // articles = await Article.find(query, options);
        articles = await Article.find({
            "datePublished": {
                "$gte": yesterdayFormatted,
                "$lt": todayFormatted
            }
        })
            .sort({ "datePublished": -1 })
            .select({ url: 1 });
    } catch (error) {
        console.error(error);
    }

    return articles
}

async function eventsSinceYesterdayByPopularity(source) {
    // Return events since yesterdy from most popular to least
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const todayFormatted = today.toISOString().slice(0, 10) + 'T00:00:00Z';

    // Yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = yesterday.toISOString().slice(0, 10) + 'T00:00:00Z';

    // var filter = {};
    // if (source != 'sumnews.net') {
    //     filter = {}
    // }

    var events = []
    try {
        events = await Event.find({
            "dateCreated": {
                "$gte": yesterdayFormatted,
                "$lt": todayFormatted
            }
        })
            .sort({ "articlesCount": -1 })
    } catch (error) {
        console.error(error)
    }

    return events;
}


// ----- USERS -----
async function getUser(userid) {
    return await User.find({ userId: userid })
}

async function saveUserToDB(user) {
    console.log('saving user to db')
    // await client.connect();
    const collection = db.collection('users')
    try {
        await collection.insertOne(user)
        console.log(`User saved successfully`)
    } catch (error) {
        console.error(`Couldn't save user to db`)
    }
}

async function aggregate(collection, pipeline) {
    // await client.connect();
    // collection = db.collection(collection)
    try {
        const cursor = await db.collection(collection).aggregate(pipeline);
        const results = await cursor.toArray();
        return results
    } catch (error) {
        console.error(`Couldn't aggregate articles`, error)
        return [{}]
    }
}

// ----- GENRES -----
async function getAllSources() {
    try {
        const genres = await Source.find();
        return genres;
    } catch (err) {
        console.error('Error fetching genres:', err);
        throw err; // Re-throw the error to handle it further up the call stack
    }
}

// ----- EVENTS -----
async function getEvents() {
    try {
        const result = await Event.find().sort({ "autoNum": -1 })
        return result;
    } catch (error) {
        console.error(`Error fetching events: `, error)
        throw error;
    }
}

async function getEventByEventUri(eventUri) {
    try {
        const result = await Event.find({ "eventUri": eventUri });
        return result[0];
    } catch (error) {
        console.error(`Error fetching events: `, error)
        throw error;
    }
}

// ----- DAILY RECAP -----
async function getDailyRecap(filter, sort = { "dateCreated": 1 }) {
    try {
        return await DailyRecap.find(filter).sort(sort)
    } catch (error) {
        console.error('Error fetching DailyRecaps: ', error)
        throw error;
    }
}

module.exports = {
    saveToDB,
    saveDocument,
    doesArticleExist,
    articlesSinceYesterday,
    eventsSinceYesterdayByPopularity,
    getArticlesFromDB,
    getUser,
    saveUserToDB,
    aggregate,
    getAllSources,
    getEvents,
    getEventByEventUri,
    getDailyRecap,
};