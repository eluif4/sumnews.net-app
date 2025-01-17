const Article = require("../../4-models/articles")
const User = require("../../4-models/users")
const Source = require('../../4-models/sources')
const Genre = require('../../4-models/genres')
const Event = require('../../4-models/events')

// const { MongoClient } = require('mongodb')
const { mongoose } = require('../../config/dbconfig')
const { handleError } = require('../../3-middleware/errorHandler')
const kleur = require('kleur')
const DailyRecap = require("../../4-models/dailyRecap")
const { articleScore } = require('../personalizedFeed')

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
    try {
        const collection = db.collection(document.collection.name);
        await collection.insertOne(document);
        console.log(`Document saved to '${document.collection.name}' collection`)
        return { success: true }
    } catch (error) {
        console.error('Failed to save document', error);;
        return { success: false };
    }
}

async function getArticlesFromDB(filter, project, sort, /*collation,*/ skip, limit, select = []) {
    //GETS ARTICLES FROM DB ACCORDING TO PARAMS
    try {
        return await Article.find(filter, project).sort(sort).skip(skip).limit(limit).select(select);
    } catch (error) {
        console.error(`Couldn't get articles from db`, error);
    }
}

async function doesArticleExist(article) {
    try {
        const { url, title } = article;

        // Check if an article with the given URL or title exists
        // Checking these two values should mitigate duplicates from the site
        const existingArticle = await Article.findOne({
            $or: [
                { url: url },    // Check if the URL exists
                { title: title } // Check if the title exists
            ]
        });

        // Return true if the article exists, otherwise false
        return !!existingArticle;
    } catch (error) {
        console.error("Error checking if article exists:", error);
        return false;
    }
}

async function getExistingArticles(urls, titles) {
    try {
        // Check if any articles with matching URLs or titles already exist in the DB
        const existingArticles = await Article.find({
            $or: [
                { url: { $in: urls } },
                { title: { $in: titles } }
            ]
        });

        // Build sets of existing URLs and titles for quick lookups
        const existingUrls = new Set(existingArticles.map(article => article.url));
        const existingTitles = new Set(existingArticles.map(article => article.title));

        return { existingUrls, existingTitles };
    } catch (error) {
        console.error("Error checking for existing articles in the database:", error);
        return { existingUrls: new Set(), existingTitles: new Set() };
    }
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
        })
            .sort({ "datePublished": -1 })
            .select({ url: 1 });
    } catch (error) {
        console.error(error);
    }

    return articles
}

async function updateArticleByID(articleId, filter, newDoc = true) {
    try {
        const updatedArticle = await Article.findByIdAndUpdate(articleId, filter);
        return updatedArticle
    } catch (err) {
        console.error(`Couldnt update article with id ${articleId}`, err)
    }
}

async function BM25(pipeline) {
    // Use the BM25 algorithm (Search Index) provided by MongoDB through the $search aggregation stage 
    const articles = await Article.aggregate(pipeline);
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

async function processUser(userDetails) {
    try {
        const { email, name, given_name, family_name, sub, picture } = userDetails; // Extract essential user info
        // Check if the user already exists in the database
        var user = await User.findOne({ googleId: sub });
        if (!user) {
            var dbsources = await Source.find().select('source'); // Get all sources from db
            var dbgenres = await Genre.find().select('genre'); // Get all genres from db

            // Create usergenres as an array of objects
            var usergenres = dbgenres.map(curGenre => ({
                name: curGenre.genre.toLowerCase(), // Convert genre name to lowercase
                clicks: 0 // Initialize clicks with 0
            }));

            // Create usersources as an array of objects
            var usersources = dbsources.map(curSource => ({
                name: curSource.source.toLowerCase(), // Convert source name to lowercase
                clicks: 0 // Initialize clicks with 0
            }));

            // If the user doesn't exist, create a new one
            user = new User({
                email: email,
                googleId: sub,
                name: name,
                given_name: given_name,
                family_name: family_name,
                picture: picture,
                createdDate: new Date(),
                bookmarks: [],
                preferences: {
                    sources: usersources,
                    genres: usergenres,
                }
            })

            await saveDocument(user); // Save the user to the database
        }
        return user;
    } catch (error) {
        console.error('Error handling Google authentication:', error);
        return null;
    }
}

async function saveUserNotificationToken(fcmtoken, userid, platform = 'unknown') {
    try {
        const updatedUser = await User.findOneAndUpdate(
            {
                googleId: userid,
                'fcmTokens.token': { $ne: fcmtoken }
            },
            {
                $push: {
                    fcmTokens: {
                        token: fcmtoken,
                        platform,
                        timestamp: new Date()
                    }
                }
            },
            {
                new: true,
                upsert: false
            }
        );

        if (updatedUser) {
            return { success: true, message: 'User was update / created' };
        } else {
            return { success: true, message: 'User want modified' };  // User wasn't found and no new user is created
        }
    } catch (error) {
        console.error('Error saving FCM token:', error);
        return { succes: false, message: 'Failed to update user' }
    }
}

async function getUserNotificationToken(userid) {
    try {
        const user = await User.findOne({ googleId: userid });
        if (user) {
            console.log('FCM Token received')
            return user.fcmToken
        }
        else {
            console.log('Failed to retrieve FCM Token. User not found')
            return null;
        }
    } catch (error) {
        console.log('Error when retrieving user FCM Token', error);
    }
}

async function getUserBookmarks(googleId) {
    try {
        const user = await User.findOne({ googleId: googleId }, { bookmarks: 1, _id: 0 });
        const articles = await Article.find({
            uuid: { $in: user.bookmarks }
        });
        return articles;
    } catch (error) {
        console.error('Error fetching bookmarks:', error)
        throw error;
    }
}

async function addArticleToBookmarks(googleId, articleuuid) {
    try {
        await User.updateOne(
            { googleId: googleId },                   // Query to find the user by googleId
            { $addToSet: { bookmarks: articleuuid } } // Add articleuuid to the bookmarks array
        );
    } catch (error) {
        console.error('Failed to save article to bookmark', error);
    }
}

async function removeArticleToBookmarks(googleId, articleuuid) {
    try {
        await User.updateOne(
            { googleId: googleId },
            { $pull: { bookmarks: articleuuid } }
        )
    } catch (error) {
        console.error('Failed to remove article from bookmark', error);
    }
}

async function getUserFeed(googleId, articlesInFeed = []) {
    var oldestArticleDateFromScoring = new Date();
    // WEIGHTS
    const WEIGHTS = {
        GENRES: 1.5,
        SOURCE: 1,
        SMOOTHNESS: 1,
        EXPLORATION: 0.1,
        ENGAGEMENT: 0.5,
    }

    const N = 50;

    try {
        const user = await User.findOne({ googleId: googleId });
        if (!user) {
            console.log('User not found')
            return [];
        }

        // Get articles from N hours ago that arent already in the feed
        const articles = await Article.find({
            datePublished: { $lt: oldestArticleDateFromScoring },
            uuid: { $nin: articlesInFeed }
        })
            .sort({ datePublished: -1 })
            .limit(N)
            .select(['genre', 'source', 'uuid', 'datePublished', 'title', 'engagements']);

        if (articlesInFeed.length > 0) {
            oldestArticleDateFromScoring = new Date(articles[articlesInFeed.length > 11 ? 10 : articlesInFeed.length].datePublished);
        }
        else {
            oldestArticleDateFromScoring = new Date()
        }

        if (!user.preferences) {
            console.log('User preferences not found')
            return [];
        }

        const scoredArticles = articles.map(article => {
            var articleScoreVal = articleScore(article, user.preferences, WEIGHTS);

            return {
                ...article.toObject(),
                relevancescore: articleScoreVal
            };
        })

        // Sort articles by their relevanceScore in descneding order
        scoredArticles.sort((a, b) => b.relevancescore - a.relevancescore);

        // Get the top 10 articles
        const top10Articles = scoredArticles.slice(0, 10);

        // Extract UUIDs from the top 10 articles
        const articleIds = top10Articles.map(article => article.uuid);

        // Find all articles from the database where the article ID is in `articleIds`
        const returnArticles = await Article.find({ uuid: { $in: articleIds } })
            .select(['-concepts', '-links', '-sentiment'])
            .lean(); // Use lean to return plain JavaScript objects, making sorting easier

        // Sort the articles to match the order of articleIds
        const sortedArticles = articleIds.map(id => returnArticles.find(article => article.uuid === id));

        return sortedArticles;

    } catch (error) {
        console.log('Failed to fetch personalized feed', error)
        return [];
    }
}

async function updateUserPreferences(googleId, updateBody) {
    try {
        const bulkUpdate = [];

        // Update clicks for genres
        updateBody.genres.forEach((genre) => {
            bulkUpdate.push({
                updateOne: {
                    filter: { googleId: googleId, 'preferences.genres.name': genre.name.toLowerCase() },
                    update: {
                        $inc: {
                            'preferences.genres.$.clicks': genre.addClicks,
                            'preferences.totalGenreClicks': genre.addClicks
                        }
                    }
                }
            });
        });

        // Update clicks for the source
        if (updateBody.source) {
            bulkUpdate.push({
                updateOne: {
                    filter: { googleId: googleId, 'preferences.sources.name': updateBody.source.name.toLowerCase() },
                    update: {
                        $inc: {
                            'preferences.sources.$.clicks': updateBody.source.addClicks,
                            'preferences.totalSourceClicks': updateBody.source.addClicks
                        }
                    }
                }
            });
        }

        // Perform the bulk update operation
        const updatedUser = await User.bulkWrite(bulkUpdate);

    } catch (error) {
        console.error('Failed to update user', error)
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

// ----- SOURCES -----
async function getAllSources() {
    try {
        const genres = await Source.find();
        return genres;
    } catch (err) {
        console.error('Error fetching genres:', err);
        throw err; // Re-throw the error to handle it further up the call stack
    }
}

async function getSourcesLogo(sources) {
    const filter = {
        source: { $in: sources }
    }

    const sumnewsnetSource = {
        _id: '1',
        logo: '1',
        source: '1'
    }

    try {
        const sourcesLogo = await Source.find(filter).select({ logo: 1, source: 1 });
        if (sources.indexOf('sumnews.net') !== -1) {
            sourcesLogo.splice(sources.indexOf('sumnews.net'), 0, sumnewsnetSource)
        }
        sourcesLogo.sort((a, b) => sources.indexOf(a.source) - sources.indexOf(b.source));
        return sourcesLogo;
    } catch (error) {
        console.error(`Couldn't fetch Sources Logo`, error)
        throw error;
    }
}

// ----- EVENTS -----
async function getEvents(filter = undefined, project = undefined, sort = { "dateCreated": -1 }, skip = 0, limit = 0) {
    try {
        const result = await Event.find(filter).select(project).sort(sort).skip(skip).limit(limit);
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
async function getDailyRecap(id) {
    const match = {
        '$match': {
            id: id
        }
    }

    const pipeline = [
        {
            $lookup: {
                from: "sources",
                localField: "source",
                foreignField: "source",
                pipeline: [
                    { $project: { _id: 0, logo: 1 } } // Only fetch the logo field
                ],
                as: "sourceDetails"
            }
        },
        {
            $unwind: "$drEvents" // Unwind the drEvents array to handle individual IDs
        },
        {
            $lookup: {
                from: "drEvents", // The collection for drEvents
                localField: "drEvents", // The unwound ID
                foreignField: "id", // Assuming drEvent has an "id" field
                as: "drEvents" // Output array of matching drEvents
            }
        },
        {
            $set: {
                drEvents: { $arrayElemAt: ["$drEvents", 0] }, // Get first (only) element from the array
                sourceLogo: { $arrayElemAt: ["$sourceDetails.logo", 0] } // Get the source logo from sourceDetails
            }
        },
        {
            $group: {
                _id: "$_id",
                id: { $first: "$id" },
                source: { $first: "$source" },
                sourceLogo: { $first: "$sourceLogo" },
                drEvents: { $push: "$drEvents" } // Collect all matching drEvents into an array
            }
        },
        {
            $project: {
                _id: 0, // Exclude the daily recap _id if not needed
                id: 1,
                source: 1,
                sourceLogo: 1,
                drEvents: 1 // Include the matched drEvent documents
            }
        }
    ];

    if (id) {
        pipeline.unshift(match);
    }
    try {
        var dailyrecap = await DailyRecap.aggregate(pipeline);
        return dailyrecap;
    } catch (error) {
        console.error('ERROR: Fetching DailyRecaps: ', error)
        throw error;
    }
}

async function getDailyRecapButtons() {
    const pipeline = [
        {
            $lookup: {
                from: "sources",
                localField: "source",
                foreignField: "source",
                pipeline: [
                    { $project: { _id: 0, logo: 1 } }  // Only fetch the logo field
                ],
                as: "sourceDetails"
            }
        },
        {
            $set: {
                sourceLogo: { $arrayElemAt: ["$sourceDetails.logo", 0] },
                drEvent: { $arrayElemAt: ["$drEvents", 0] }  // Get the first string in drEvents array
            }
        },
        {
            $project: {
                id: 1,
                sourceLogo: 1,
                drEvent: 1,
                source: 1
            }
        }
    ]

    try {
        const dailyRecapButtons = await DailyRecap.aggregate(pipeline);
        return dailyRecapButtons;
    } catch (error) {
        console.error('ERROR: Fetching DailyRecapButtons: ', error)
        throw error;
    }
}

async function getTodaysDailyRecapLink() {
    const filter = { source: 'sumnews.net' };
    const project = {
        id: 1,
        drEvents: { $slice: [0, 1] } // Fetches the first element from drEvents array
    };
    const response = await DailyRecap.find(filter).select(project).limit(1);
    const dailyRecap = response[0];

    const todaysDailyRecapLink = `dailyrecap/${dailyRecap.id}/${dailyRecap.drEvents[0]}`;
    return todaysDailyRecapLink
}

async function updateArticleEngagement(articleuuid, engagementType) {
    const update = {};
    update[`engagements.${engagementType}`] = 1;

    await Article.updateOne(
        { uuid: articleuuid },
        { $inc: update }
    );
}

/* NOTIFICATIONS */
async function getAllFCMTokens() {
    const users = await User.find().select("fcmTokens"); // Fetch all users with their fcmTokens field
    const fcmTokens = users
        .flatMap(user => user.fcmTokens.map(fcmToken => fcmToken.token)); // Extract and flatten all token values
    return fcmTokens;
}

module.exports = {
    saveToDB,
    saveDocument,
    doesArticleExist,
    getExistingArticles,
    articlesSinceYesterday,
    updateArticleByID,
    eventsSinceYesterdayByPopularity,
    getArticlesFromDB,
    BM25,
    getUser,
    saveUserToDB,
    processUser,
    saveUserNotificationToken,
    getUserNotificationToken,
    getUserBookmarks,
    addArticleToBookmarks,
    removeArticleToBookmarks,
    getUserFeed,
    updateUserPreferences,
    aggregate,
    getSourcesLogo,
    getAllSources,
    getEvents,
    getEventByEventUri,
    getDailyRecap,
    getDailyRecapButtons,
    getTodaysDailyRecapLink,
    updateArticleEngagement,
    getAllFCMTokens,
};