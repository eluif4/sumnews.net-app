//---LIBRARIES---
const path = require("path");
const cron = require("node-cron");
const kleur = require('kleur');
const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');
const { BSON } = require('mongodb');
var cache = require('memory-cache');
const { IgApiClient } = require('instagram-private-api');

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

//---FUNCTIONS---
const { getArticlesUsingRecentActiviy } = require('./server/2-utils/api/getArticlesFromAPI.js');
const { getAllSources, articlesSinceYesterday, doesArticleExist } = require('./server/2-utils/db/databaseAccess.js')
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

app.use(DBGETARTICLESROUTES);
app.use(DBGETCOLLECTIONSROUTES);
app.use(AUTH);
app.use(USERINFO);

app.listen(port, async function () {
    console.log(`Server is running on port ${port} in DEVELOPMENT mode`);

    // FUTURE CHANGE: Place this on server start
    const IG_USERNAME = process.env.IG_USERNAME;
    const IG_PASSWORD = process.env.IG_PASSWORD;

    console.log('Connecting to ' + IG_USERNAME + ' account...');
    const ig = new IgApiClient();
    ig.state.generateDevice(IG_USERNAME);
    await ig.account.login(IG_USERNAME, IG_PASSWORD);

    console.log('Connected...')

    // Execute code after server start
    cronTask().catch(err => console.log(err))
    cronDailyRecap().catch(err => console.log(err))
    cacheSourcesEvery24H().catch(err => console.log(err))
    cacheGenresEvery24H().catch(err => console.log(err))
})

//---IMPORTS---
const { articleQueue } = require('./server/2-utils/articleQueueHandler.js');

//---RUN MAIN FUNCTION---
// 0 = OFF, 1 = TESTING, 2 = RUNNING
const state = 2;
async function cronTask() {
    // cron.schedule('*/15 * * * *', async () => {
    if (state == 2) {
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
    else if (state == 1) {
        const tempArticle = {
            "uri": "8345452322",
            "lang": "eng",
            "isDuplicate": false,
            "date": "2024-10-01",
            "time": "18:27:34",
            "dateTime": "2024-10-01T18:27:34Z",
            "dateTimePub": "2024-10-01T18:27:09Z",
            "dataType": "news",
            "sim": 0.6470588445663452,
            "url": "https://nypost.com/2024/10/01/business/blackrocks-larry-fink-sounds-off-on-investors-expecting-huge-fed-rate-cuts/",
            "title": "BlackRock's Larry Fink sounds off on investors expecting huge Fed...",
            "body": "BlackRock CEO Larry Fink said on Tuesday investors are wrong if they think the Fed will make massive interest rate cuts later this year because the billionaire money man believes the US economy will continue to grow.\n\nFink dismissed market predictions that rates will be slashed further through the end of year after Chairman Jerome Powell lowered them by half a percentage point two weeks ago.\n\nIt was the first reduction since 2020 and a bigger-than-expected cut as Western economies emerge from the aftermath of the global coronavirus pandemic.\n\n\"I do believe there's room for easing more,\" the boss of the investment giant that manages at least $9 trillion of assets told Bloomberg TV in an interview.\n\n\"I see more policies by more governments that tend to be more inflationary. With that in mind, it is hard for me to see another 200 basis points of a decline in short rates.\"\n\nA cut of 200 basis points by Fed officials between now and the end of 2024 would amount to a reduction of two percentage points from its current level of 4.75%-5%.\n\nEconomists are already pointing to Friday's jobs report as a key piece of data that could alter the Fed's policy path.\n\nIf the unemployment rate rises noticeably or hiring stumbles, officials could consider a sharper rate cut later this year.\n\nUsing a term for a slowing or stagnant economy that can eventually tip into recession, Fink added: \"I don't see any landing.\n\n\"We are going to continue to grow. There are segments of the economy that are struggling. There are segments that are doing really well,\" he said. \"We are going to grow at 2 or 3%.\n\nLower interest rates are aimed at making it less expensive for businesses and households to borrow and therefore spend more freely in the hope of boosting economic growth.\n\nBut overly aggressive cuts can pump excessive money into the economy, potentially stoking inflation - the rise in goods and services over time - once more.\n\nFink, the founder of the world's largest asset manager, pointed to stronger corporate earnings as an indication that the US economy was in better shape than some commentators suggest.\n\nHe also took a dig at America's corporate titans that were still doing extensive business in China because of how Beijing was supporting Russia by buying more of its oil and gas supplies.\n\n\"Ukraine is at our doorsteps here and I'm surprised that there's not a larger questioning or demanding -- you're supporting our enemy,\" the top money man told Bloomberg. \"There should be a cost to that.\"\n\nFink has an estimated net worth of $1.2 billion, according to Forbes, and is a longtime Democrat Party donor.\n\nBlackRock has in recent years been a vocal cheerleader for the Biden Administration's policies on Environmental Social Governance, more commonly known as ESG.\n\nIt the practice of encouraging major firms and investors to be mindful of climate change as part of their business models, but also encourage diversity in corporate boardrooms.\n\nFink has clashed in recent months with fellow Wall Street titan Boaz Weinstein whose Saba Capital Management has launched an activist raid on a series of BlackRock funds this year.\n\nSaba, which has acquired sizeable stakes in at least 10 of the funds, contends that BlackRock's mismanagement is depressing the funds' profitability.\n\nWeinstein's investment firm has roughly $5 billion of assets under management at present.",
            "source": {
                "uri": "nypost.com",
                "dataType": "news",
                "title": "New York Post"
            },
            "authors": [],
            "image": "https://nypost.com/wp-content/uploads/sites/2/2024/10/blackrocks-larry-fink-says-market-90810518.jpg?quality=75&strip=all&w=1024",
            "eventUri": "eng-9954080",
            "sentiment": -0.192156862745098
        };
        articleQueue.enqueue(tempArticle)
        processQueue();
    }
    // })
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

// app.get('/createDailyRecapCron', async (req, res) => {
//     const cachedSources = cache.get('sources');
//     response = cachedSources ? cachedSources : await getAllSources();
//     const responseSources = response.map(source => source.source);
//     const shuffledSources = shuffleArray(responseSources);
//     const sources = ['sumnews.net', ...shuffledSources];
//     for (const source of sources) {
//         await createDailyRecap(source);
//     }
// })

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