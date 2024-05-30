//---LIBRARIES---
const path = require("path");
const cron = require("node-cron");
const kleur = require('kleur');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const { BSON } = require('mongodb')

//---CONFIG---
dotenv.config({ path: path.resolve(__dirname, './server/config/config.env') });
const mongodb = require('./server/config/dbconfig'); // Connects to mongodb server

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
const { getAllSources, articlesSinceYesterday, saveDocument } = require('./server/2-utils/db/databaseAccess.js')
const { processQueue } = require('./server/2-utils/articleQueueHandler.js')
const { createDailyRecap } = require('./server/2-utils/dailyRecaps.js')

//---SERVER SETUP---
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(
    cors({
        origin: "*",
    })
)
app.use(DBGETARTICLESROUTES)
app.use(DBGETCOLLECTIONSROUTES)

app.listen(port, function () {
    console.log(`Server is running on port ${port} in DEVELOPMENT mode`)
})

//---IMPORTS---
const { articleQueue } = require('./server/2-utils/articleQueueHandler.js');

//---RUN MAIN FUNCTION---
async function cronTask() {
    // cron.schedule('*/60 * * * *', async () => {
    if (false) {
        try {
            const date = new Date()
            console.log(kleur.bgBlue(`Task started @ ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`))

            const allSources = (await getAllSources())
            var sources = allSources.map(source => source.sourceName)

            // FUTURE CHANGE: LOOK THROUGH ALL PAGES (IF THE API CALL IS QUICK AND I DONT HAVE TOO MANY SOURCES THEN I SHOULDNT WORRY ABOUT THIS)

            const apiresponse = await getArticlesUsingRecentActiviy(sources); // Get articles from newsapi.ai
            const articles = apiresponse.recentActivityArticles.activity;

            // Sort articles from oldest to newest
            articles.sort((a, b) => {
                const dateA = new Date(a.dateTimePub);
                const dateB = new Date(b.dateTimePub);
                return dateA - dateB;
            });

            // Get all articles from yesterday and today
            const articlesInDB = await articlesSinceYesterday();

            // Calculate size of query
            // var size = 0;
            // articlesInDB.forEach(
            //     function(doc) {
            //         size += BSON.calculateObjectSize(doc)
            //     }
            // )
            // console.log(size)

            // Loop over all articles from API request
            for (const article of articles) {
                var articleExistsInDB = false;
                const articleExistInQueue = articleQueue.exist(article);

                // Loop over all articles in DB from yesterday and today and check if current article exists in DB
                for (const a of articlesInDB) {
                    if (a.url == article.url)
                        articleExistsInDB = true;
                }

                // If article isnt in DB or QUEUE
                if (!articleExistInQueue && !articleExistsInDB) {
                    articleQueue.enqueue(article) // Adds article to queue
                }
            }
            console.log(kleur.blue(`Queue size (${articleQueue.size()})`))

            if (!articleQueue.isEmpty()) { // and processqueue isnt 
                processQueue()
            }

        }
        catch (error) {
            console.error(kleur.red('Problem with cron ->'), error)
        }
    }
    // })
}

async function cronDailyRecap() {
    // CRON task runs at 18:00
    // cron.schedule('*/1 * * * *', async () => {
    if (true) {
        const sources = ['sumnews.net', 'msnbc.com', 'people.com', 'cnn.com']
        for (const source of sources) {
            const dr = await createDailyRecap(source);
            saveDocument(dr)
        }
    }
    // })
}

cronTask().catch(err => console.log(err))
cronDailyRecap().catch(err => console.log(err))