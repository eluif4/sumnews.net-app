//---LIBRARIES---
const path = require("path");
const cron = require("node-cron");
const kleur = require('kleur');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const { BSON } = require('mongodb')
var cache = require('memory-cache')

//---CONFIG---
dotenv.config({ path: path.resolve(__dirname, './server/config/config.env') });
const mongoose = require('./server/config/dbconfig'); // Connects to mongodb server

//---FOLDERS---
const ROUTES = path.join(__dirname, 'server/1-routes');
const UTILS = path.join(__dirname, 'server/2-utils');
// const APIUTILS = path.join(__dirname, 'server/2-utils/api');
const DBUTILS = path.join(__dirname, 'server/2-utils/db');
const MODELS = path.join(__dirname, 'server/4-models');
const LOGIC = path.join(__dirname, 'server/5-logic');
const CONTROLLER = path.join(__dirname, 'server/6-controllers');

//---ROUTE FILES---
const DBGETARTICLESROUTES = require('./server/1-routes/db/getCollections.js');
const DBGETCOLLECTIONSROUTES = require('./server/1-routes/db/getArticles.js');

//---FUNCTIONS---
const { getArticlesUsingRecentActiviy } = require('./server/2-utils/api/getArticlesFromAPI.js');
const { getAllSources, articlesSinceYesterday, doesArticleExist } = require('./server/2-utils/db/databaseAccess.js')
const { processQueue } = require('./server/2-utils/articleQueueHandler.js')
const { createDailyRecap } = require('./server/2-utils/dailyRecaps.js')

//---SERVER SETUP---
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.use(cors({
    origin: '*', // Allow requests from any origin
    credentials: true // Include credentials like cookies in requests
}));


app.use(DBGETARTICLESROUTES)
app.use(DBGETCOLLECTIONSROUTES)

app.listen(port, function () {
    console.log(`Server is running on port ${port} in PRODUCTION mode`)
})

//---IMPORTS---
const { articleQueue } = require('./server/2-utils/articleQueueHandler.js');

//---RUN MAIN FUNCTION---
async function cronTask() {
    cron.schedule('*/20 * * * *', async () => {
        if (true) {
            try {
                const date = new Date()
                console.log(kleur.bgBlue(`Task started @ ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`))

                const cachedSources = cache.get('sources');
                var allSources = cachedSources ? cachedSources : await getAllSources();

                var sources = allSources.map(source => source.source)

                // FUTURE CHANGE: LOOK THROUGH ALL PAGES (IF THE API CALL IS QUICK AND I DONT HAVE TOO MANY SOURCES THEN I SHOULDNT WORRY ABOUT THIS)

                // Get most recent articles from 'sources' from Newsapi.ai
                const apiresponse = await getArticlesUsingRecentActiviy(sources);
                const articles = apiresponse.recentActivityArticles.activity;

                // Sort articles from oldest to newest
                articles.sort((a, b) => {
                    const dateA = new Date(a.dateTimePub);
                    const dateB = new Date(b.dateTimePub);
                    return dateA - dateB;
                });

                // Loop over all articles from API response
                for (const article of articles) {
                    var articleExistsInDB = false;
                    const articleExistInQueue = articleQueue.exist(article);

                    // FUTURE CHANGE: For further proof, check article too
                    articleExistsInDB = await doesArticleExist(article);

                    // If article isn't in DB or QUEUE
                    if (!articleExistInQueue && !articleExistsInDB) {
                        articleQueue.enqueue(article) // Adds article to queue
                    }
                }
                console.log(kleur.blue(`Queue size (${articleQueue.size()})`))

                // Process 'articleQueue' if it isnt empty
                if (!articleQueue.isEmpty()) {
                    processQueue()
                }
            }
            catch (error) {
                console.error(kleur.red('Problem with cron ->'), error)
            }
        }
    })
}

async function cronDailyRecap() {
    // CRON task runs at 18:00
    cron.schedule('0 18 * * *', async () => {
        if (true) {
            const cachedSources = cache.get('sources');
            response = cachedSources ? cachedSources : await getAllSources();
            const responseSources = response.map(source => source.source);
            const shuffledSources = shuffleArray(responseSources);
            const sources = ['sumnews.net', ...shuffledSources];
            for (const source of sources) {
                await createDailyRecap(source);
            }
        }
    })
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function cacheSourcesEvery24H() {
    // Save all sources in cache at midnight
    cron.schedule('0 0 * * *', async () => {
        const date = new Date()
        console.log(`Caching all sources @ ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)
        const response = await getAllSources()
        cache.put('sources', response)
    })
}

async function cacheGenresEvery24H() {
    // Save all genres in cache at midnight
    cron.schedule('0 0 * * *', async () => {
        const date = new Date()
        console.log(`Caching all sources @ ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)
        const response = await getAllGenres()
        cache.put('genres', response)
    })
}

cronTask().catch(err => console.log(err))
cronDailyRecap().catch(err => console.log(err))
cacheSourcesEvery24H().catch(err => console.log(err))
cacheGenresEvery24H().catch(err => console.log(err))