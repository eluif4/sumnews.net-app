const Article = require("../../4-models/articles")
const User = require("../../4-models/users")
const Source = require('../../4-models/sources')
const Event = require('../../4-models/events')

const { MongoClient } = require('mongodb')
const { handleError } = require('../ErrorHandler')
const kleur = require('kleur')

// FUTURE CHANGE: i dont think this is the correct way to connect to the db. By default the project should connect to the articlesdb db
const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
var db = client.db(process.env.MONGODB_DATABASE)

// ----- ARTICLES -----
async function saveToDB(article) { //SAVES THE GIVEN ARTICLE TO DB WITH ALL RELEVANT METADATA ABOUT IT
    console.log(kleur.bold(`Saving article...`))

    await client.connect();
    const collection = db.collection('articles')
    try {
        await collection.insertOne(article)
    } catch (error) {
        handleError(error, `Coulnd't save article to db`)
    }
}

async function saveDocument(document) {
    // console.log(kleur.bold(`Saving ${document.collection.modelName} into '${document.collection.name}' collection`));

    await client.connect();
    const collection = db.collection(document.collection.name)
    await collection.insertOne(document)
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
        articles = await Article.find({
            "datePublished": {
                "$gte": yesterdayFormatted,
                "$lt": todayFormatted
            }
        }, { "_id": 1, "url": 1 }).sort({ "datePublished": -1 });


    } catch (error) {
        console.error(error);
    }

    // FUTURE CHANGE: retrieve only the url form the database and not the whole article information
    return articles
}

// ----- USERS -----
async function getUser(userid) {
    return await User.find({ userId: userid })
}

async function saveUserToDB(user) {
    console.log('saving user to db')
    await client.connect();
    const collection = db.collection('users')
    try {
        await collection.insertOne(user)
        console.log(`User saved successfully`)
    } catch (error) {
        console.error(`Couldn't save user to db`)
    }
}

async function aggregate(collection, pipeline) {
    await client.connect();
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
        return await Event.find().sort({ "autoNum": -1 })
    } catch (error) {
        console.error(`Error fetching events: `, error)
        throw err;
    }
}

module.exports = {
    saveToDB,
    saveDocument,
    doesArticleExist,
    articlesSinceYesterday,
    getArticlesFromDB,
    getUser,
    saveUserToDB,
    aggregate,
    getAllSources,
    getEvents,
};