const { saveDocument, getArticlesFromDB, getEvents, updateArticleByID } = require("./db/databaseAccess");
const { createDailyRecapSummaryAndTitle } = require('./api/geminiRequests.js');
const { generateDaiyRecapImage } = require('./api/stencil-image-template-api.js');
const { uploadStoryToInstagram } = require('./api/instagram-graphi-api.js');
const { v4: uuidv4 } = require('uuid');
const DrEvent = require('../4-models/drEvents');
const DailyRecap = require("../4-models/dailyRecap");
var cache = require('memory-cache');

// Yesterday's date
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1)
yesterday.toISOString()

async function createDailyRecap(source) {
    console.log(`Creating Daily Recap for ${source}`)
    var drEventUri = [];

    // Delete DrEvents from the given source ( Filter: id that contains source )
    await deleteDrEvents({ "id": { "$regex": source } })

    if (source === 'sumnews.net') {
        try {
            var filter = {
                "dateCreated": {
                    "$gte": yesterday,
                }
            }
            var sort = { "articlesCount": -1 }

            // Fetch 5 events with most highest 'articlesCount' since yesterday
            var events = await getEvents(filter, undefined, sort, 0, 5)
            var eventUris = events.map(event => event.eventUri)

            // For each event, save it in the DB
            for (const eventUri of eventUris) {
                let drUri = `${source}_${uuidv4()}` // Create drUri

                // Get all articles in DB from event
                let articles = await getArticlesFromDB({ eventUri: eventUri }, undefined, { datePublished: -1 }, 0, 0)
                // FILTER OUT ARTICLES THAT ALREADY EXIST IN DB
                // Create a Set to track unique titles or URLs
                const seenTitles = new Set();
                const seenUrls = new Set();

                // Filter articles to remove duplicates by title or URL
                articles = articles.filter(article => {
                    if (seenTitles.has(article.title) || seenUrls.has(article.url)) {
                        // If the title or URL is already in the Set, skip this article
                        return false;
                    }

                    // Otherwise, add the title and URL to the Sets
                    seenTitles.add(article.title);
                    seenUrls.add(article.url);

                    return true; // Keep this article
                });

                // Failsafe: If the event contains any articles
                if (articles.length > 0) {
                    // Get all the information about the drEvent
                    const geminiResponse = await createDailyRecapSummaryAndTitle(articles);
                    // const data = await geminiResponse.json();
                    const title = geminiResponse.title;
                    const summary = geminiResponse.summary;
                    const totalCharCount = articles.reduce((sum, article) => sum + article.articleCharCount, 0);
                    var minutesSaved = calculateAverageTimeSaved(articles.length, totalCharCount, summary);
                    minutesSaved = Math.round(minutesSaved * 2) / 2;

                    drEventUri.push(drUri) // Add drUri to array of drEvents (for the dailyRecap object)
                    // instagramStoryArticles.push(articles[0])
                    let drEvent = new DrEvent({
                        id: drUri,
                        dateCreated: new Date(),
                        imageUrl: articles[0].imageUrl || "https://drive.google.com/uc?export=view&id=19QGhYWzvt6oExMg6DKd3FeSvclpFLktS",
                        title: title || "Whoops, something went wrong",
                        summary: summary || "We are sorry to inform you that something went wrong with our systems. Please be patient while we are working to solve this problem",
                        articleCount: articles.length,
                        genre: articles[0].genre[0] || "World",
                        minutesSaved: minutesSaved || 0,
                        // eventUri: eventUri
                    })

                    const response = await saveDocument(drEvent);
                    if (response.success) { // If document has been saved
                        try {
                            // Create image from Stencil template
                            const dailyRecapImageUrl = await generateDaiyRecapImage(drEvent.toObject())

                            // Upload to instagram Story
                            if (dailyRecapImageUrl) {
                                const response = await uploadStoryToInstagram(dailyRecapImageUrl);
                            } else {
                                console.log(`FAILED to create 'dailyRecapImageUrl'`)
                            }
                        } catch (error) {
                            console.error('Uploading Instagram Story logic failed', error)
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Failed to create ${source} drEvents`);
        }
        // If source !== sumnews.net
    } else {
        try {
            var filter = {
                "source": source,
                "datePublished": { "$gte": yesterday },
                // "drUri": null
            }

            const sort = {
                summarizedContent: -1
            }

            // Array of 5 longest articles in db from past 24 hours
            // FUTURE CHANGE: Update filter to make sure they arent from the same eventUri
            var articles = await getArticlesFromDB(filter, undefined, sort, 0, 5);

            // FILTER OUT ARTICLES THAT ALREADY EXIST IN DB
            // Create a Set to track unique titles or URLs
            const seenTitles = new Set();
            const seenUrls = new Set();

            // Filter articles to remove duplicates by title or URL
            articles = articles.filter(article => {
                if (seenTitles.has(article.title) || seenUrls.has(article.url)) {
                    // If the title or URL is already in the Set, skip this article
                    return false;
                }

                // Otherwise, add the title and URL to the Sets
                seenTitles.add(article.title);
                seenUrls.add(article.url);

                return true; // Keep this article
            });

            var sourceEventArticles = [];
            // Loop over all 5 articles. Each article becomes its own 'event' in a Daily Recap
            for (const article of articles) {
                // console.log(`uuid: ${article.uuid} { drUri: ${article.drUri} }`)
                let drUri = `${source}_${uuidv4()}` // Create drUri
                var summary = undefined;
                var title = undefined;

                if (article.eventUri != null) { // If Article is part of an Event
                    filter = {
                        "source": source,
                        "eventUri": article.eventUri,
                        // "drUri": null
                    }

                    // Get all Article documents in source with same eventUri
                    sourceEventArticles = await getArticlesFromDB(filter);
                    // if (sourceEventArticles.length > 1) {
                    const geminiResponse = await createDailyRecapSummaryAndTitle(sourceEventArticles);
                    // const data = await geminiResponse.json();
                    title = geminiResponse.title;
                    summary = geminiResponse.summary;
                    // } else {
                    //     title = article.title;
                    //     summary = article.summarizedContent;
                    // }
                }
                // If articleisnt part of an Event
                else {
                    sourceEventArticles.push(article);
                    title = article.title;
                    summary = article.summarizedContent;
                }

                // Calculate the average amount of time saved
                const totalCharCount = sourceEventArticles.reduce((sum, article) => sum + article.articleCharCount, 0);
                var minutesSaved = calculateAverageTimeSaved(sourceEventArticles.length, totalCharCount, summary);
                minutesSaved = Math.round(minutesSaved * 2) / 2;

                let drEvent = new DrEvent({
                    id: drUri,
                    dateCreated: new Date(),
                    imageUrl: sourceEventArticles[0].imageUrl || "https://drive.google.com/uc?export=view&id=19QGhYWzvt6oExMg6DKd3FeSvclpFLktS",
                    title: title || "Whoops, something went wrong",
                    summary: summary || "We are sorry to inform you that something went wrong with our systems. Please be patient while we are working to solve the problem",
                    articleCount: sourceEventArticles.length,
                    genre: sourceEventArticles[0].genre[0],
                    minutesSaved: minutesSaved,
                    // eventUri: article.eventUri
                });

                // let drEvent = new DrEvent({
                //     id: uuidv4(),
                //     dateCreated: new Date(),
                //     imageUrl: articles[0].imageUrl || "https://drive.google.com/uc?export=view&id=19QGhYWzvt6oExMg6DKd3FeSvclpFLktS",
                //     title: title || "Whoops, something went wrong",
                //     summary: summary || "We are sorry to inform you that something went wrong with our systems. Please be patient while we are working to solve the problem",
                //     articleCount: articles.length,
                //     genre: articles[0].genre[0] || "World",
                //     minutesSaved: minutesSaved || 0
                // })

                const response = await saveDocument(drEvent);
                if (response.success == true) {
                    drEventUri.push(drUri);
                }
            }
        } catch (error) {
            console.error(`Failed when creating ${source} drEvents`)
        }
    }

    // Delete yesterday daily recaps
    await deleteDailyRecap({ source: source });

    const dr = new DailyRecap({
        id: uuidv4(),
        source: source,
        drEvents: drEventUri,
        dateCreated: new Date(),
    })

    try {
        if (dr.drEvents.length > 0) {
            await saveDocument(dr);
            console.log(`DailyRecap (${dr.source}) ${dr.id} was saved succesfully`);
        } else {
            console.log(`DailyRecap doesnt have any events and therefore wasnt saved to DB`);
        }
    } catch (err) {
        console.error(`Error saving DailyRecap ${dr.id}`, err);
    }
}

async function deleteDailyRecap(filter) {
    // Delete a single DailyRecap document according to the param: filter passed
    if (!filter || Object.keys(filter).length === 0) {
        console.error("Error: Empty filter provided. No document will be deleted.");
        return;
    }

    try {
        const result = await DailyRecap.findOneAndDelete(filter);
        if (result) {
            console.log("Document deleted successfully:", result);
        } else {
            console.log("No document found matching the filter.");
        }
    } catch (err) {
        console.error("Error deleting DailyRecap:", err);
    }
}

async function deleteDrEvents(filter) {
    // Delete a single DailyRecap document according to the param: filter passed
    if (!filter || Object.keys(filter).length === 0) {
        console.error("Error: Empty filter provided. No document will be deleted.");
        return;
    }

    try {
        const result = await DrEvent.deleteMany(filter);
        if (result) {
            console.log("Document deleted successfully:", result);
        } else {
            console.log("No document found matching the filter.");
        }
    } catch (err) {
        console.error("Error deleting DrEvent:", err);
    }
}

function calculateAverageTimeSaved(articleCount, totalCharCount, summary) {
    const AVG_WPM = 238;
    const AVGCHAR_PER_WORD = 4.7;

    // Calculate the reading time in minutes for the original articles
    const totalArticleReadingTime = totalCharCount / (AVGCHAR_PER_WORD * AVG_WPM);

    // Calculate the reading time for the provided summary text
    const summaryReadingTime = summary.length / (AVGCHAR_PER_WORD * AVG_WPM);

    // Calculate the total time saved across all articles
    const totalTimeSaved = totalArticleReadingTime - (summaryReadingTime * articleCount);

    // Calculate the average time saved per article
    const averageTimeSaved = totalTimeSaved / articleCount;

    return averageTimeSaved.toFixed(2);
}

module.exports = {
    createDailyRecap,
    deleteDailyRecap,
    deleteDrEvents
}