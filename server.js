//---LIBRARIES---
const path = require("path");
const cron = require("node-cron");
const kleur = require('kleur');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const { BSON } = require('mongodb');
var cache = require('memory-cache');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

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
const AUTH = require('./server/1-routes/api/auth.js');
const USERINFO = require('./server/1-routes/db/userInfo.js');
const INSTAGRAM_ROUTES = require('./server/1-routes/api/instagram_routes.js');
const NOTIFICATION_ROUTES = require('./server/1-routes/notifications.js');
// const GOOGLEDRIVE = require('./server/1-routes/api/googleDrive.js')

//---FUNCTIONS---
const { getArticlesUsingRecentActiviy } = require('./server/2-utils/api/getArticlesFromAPI.js');
const { getAllSources, getExistingArticles } = require('./server/2-utils/db/databaseAccess.js')
const { processQueue } = require('./server/2-utils/articleQueueHandler.js')
const { createDailyRecap } = require('./server/2-utils/dailyRecaps.js')

//---SERVER SETUP---
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Use the 'helmet' package to set HTTP headers that enhance security
app.use(helmet());

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 200, // Limit each IP to 30 requests per 10 minutes
    message: 'Resource exhausted. Please try again later'
})

app.use(limiter);

app.use(cors({
    origin: ['https://app.sumnews.net', 'http://localhost', 'http://localhost:5173', 'https:localhost', 'capacitor://localhost', 'ionic://localhost'],
    credentials: true, // Allows cookies to be included in requests (if necessary)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'], // Include 'Cache-Control' here
}));

// Remove later: Log the origin of incoming requests
app.use((req, res, next) => {
    console.log('Request received from origin:', req.headers.origin || 'No Origin');
    next();
});

app.use(DBGETARTICLESROUTES);
app.use(DBGETCOLLECTIONSROUTES);
app.use(AUTH);
app.use(USERINFO);
app.use(INSTAGRAM_ROUTES);
app.use(NOTIFICATION_ROUTES);
// app.use(GOOGLEDRIVE);

app.listen(port, '0.0.0.0', function () {
    console.log(`Server is running on port ${port} in PRODUCTION mode`);

    // Execute code after server start
    cronTask().catch(err => console.log(err))
    cronDailyRecap().catch(err => console.log(err))
    cacheSourcesEvery24H().catch(err => console.log(err))
    cacheGenresEvery24H().catch(err => console.log(err))
})

//---IMPORTS---
const { articleQueue } = require('./server/2-utils/articleQueueHandler.js');
const { sendDailyRecapNotification } = require("./server/6-controllers/notificationController.js");

//---RUN MAIN FUNCTION---
// 0 = OFF, 1 = TESTING, 2 = RUNNING
const state = 0;
async function cronTask() {
    cron.schedule('*/20 * * * *', async () => {
        if (true) {
            try {
                const date = new Date()
                console.log(kleur.bgBlue(`Task started @ ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`))

                const cachedSources = cache.get('sources');
                var allSources = cachedSources ? cachedSources : await getAllSources();

                var sources = allSources.map(source => source.source)

                // Get most recent articles from 'sources' from Newsapi.ai
                const apiresponse = await getArticlesUsingRecentActiviy(sources);
                const articles = apiresponse.recentActivityArticles.activity;

                // Sort articles from oldest to newest
                articles.sort((a, b) => {
                    const dateA = new Date(a.dateTimePub);
                    const dateB = new Date(b.dateTimePub);
                    return dateA - dateB;
                });

                // Add articles from API response to Article Queue for processing. 
                // The code below is to make sure they dont already exist in the queue or the DB

                // Step 1: Collect all URLs and titles from the articles
                const urls = articles.map(article => article.url);
                const titles = articles.map(article => article.title);

                // Step 2: Get sets of URLs and titles that exist in the database
                const { existingUrls, existingTitles } = await getExistingArticles(urls, titles);

                // Step 3: Track URLs and titles already in the queue
                const queueUrls = new Set(articleQueue.toArray().map(a => a.url));
                const queueTitles = new Set(articleQueue.toArray().map(a => a.title));
                for (const article of articles) {
                    const { url, title } = article;
                    const articleExistInQueue = queueUrls.has(url) || queueTitles.has(title);
                    const articleExistsInDB = existingUrls.has(url) || existingTitles.has(title);

                    // If article isn't in DB or QUEUE
                    if (!articleExistInQueue && !articleExistsInDB) {
                        articleQueue.enqueue(article); // Adds article to queue

                        // Update the Sets for future checks
                        queueUrls.add(url);
                        queueTitles.add(title);
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

            // Send Notification to all Connected Devices
            await sendDailyRecapNotification();
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
