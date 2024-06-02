const { eventsSinceYesterdayByPopularity, saveDocument, getArticlesFromDB, getEvents, updateArticleByID } = require("./db/databaseAccess");
const { v4: uuidv4 } = require('uuid');
const DrEvent = require('../4-models/drEvents')
const DailyRecap = require("../4-models/dailyRecap");

const today = new Date();
today.setDate(today.getDate() + 1);
const todayFormatted = today.toISOString().slice(0, 10) + 'T00:00:00Z';

// Yesterday's date
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayFormatted = yesterday.toISOString().slice(0, 10) + 'T00:00:00Z';

async function createDailyRecap(source) {
    console.log(`Creating Daily Recap for ${source}`)
    // FUTURE CHANGE: USE getEvents function instead of this and limit to 5 objects. WILL SAVE LOTS OF TIME
    // var events = await eventsSinceYesterdayByPopularity(); // events are sorted by articleCount descending
    var filter = {
        "dateCreated": {
            "$gte": yesterdayFormatted,
            "$lt": todayFormatted
        }
    }

    var sort = { "articlesCount": -1 }
    var events = await getEvents(filter, undefined, sort, 0, 5)
    var drEvents = [];
    if (source === 'sumnews.net') {

        var eventUris = events.slice(0, 5).map(event => event.eventUri) // Save only top 5 'events'
        for (const eventUri of eventUris) { // Loop over events
            let drUri = `${source}_${uuidv4()}` // Create drUri (using sumnews.net as source)

            // let apiResponse = await getArticlesFromEvent(eventUri) // Get Event Articles (from api) i need from db
            let articles = await getArticlesFromDB({ eventUri: eventUri }, undefined, { datePublished: -1 })
            for (const article of articles) { // Loop over articles: update drUri property to the new drUri value (sumnews.net-uuid)
                try {
                    if (!article.drUri) {
                        let updatedArticle = await updateArticleByID(article._id, { drUri: drUri }) // Update article with drUri
                        console.log(`Article { uuid: ${updatedArticle.uuid} } has been updated succesfully`)
                    } else {
                        console.log(`Didnt update Article { uuid: ${article.uuid} } since it always has a drUri`)
                    }
                } catch (err) {
                    console.log(`Couldnt update article { uuid: ${article.uuid} }`)
                }
            }
            drEvents.push(drUri) // Add drUri to array of drEvents (for the dailyRecap object)

            if (articles.length > 0) { // If there are articles in the Daily Recap
                let drEvent = new DrEvent({
                    id: uuidv4(),
                    drUri: drUri,
                    savedArticles: articles.length, // Articles: {drUri: 'sumnews.net_12e4c951-51e1-4a47-b2a9-0da3a311da48'} return 63 documents | DrEvent { id: 'c3ed8b0d-f422-4966-b236-bfdff208999e' } .savedArticles = 46
                    dateCreated: new Date(),
                })

                await saveDocument(drEvent);
            }
        }
    } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        var filter = { // Create mongondb Filter
            "source": source,
            "datePublished": { "$gte": new Date(yesterday) }
        }

        const sort = { // Create mongodb Sort
            content: -1
        }

        // Articles can already have a drUri from a previous source example: {uuid: 'e41f9847-7a36-419b-8fde-8c2be6eef4f9'}
        var articles = await getArticlesFromDB(filter, undefined, sort, 0, 5); // Array of 5 longest articles in db from past 24 hours
        var sourceEventArticles = [];
        for (const article of articles) {
            if (!article.drUri) {
                let drUri = `${source}_${uuidv4()}` // Create drUri (using sumnews.net as source)

                if (article.eventUri != null) { // If Article is part of an Event
                    filter = { "source": source, "eventUri": article.eventUri } // Create mongondb Filter
                    sourceEventArticles = await getArticlesFromDB(filter) // Get all Article in source with same eventUri

                    for (const article of sourceEventArticles) { // Loop over all Article in source with same eventUri
                        try {
                            const updatedArticle = await updateArticleByID(article._id, { drUri: drUri }, true) // Update Article with new drUri
                            console.log(`Article { uuid: ${updatedArticle.uuid} } has been updated succesfully`)
                        } catch (err) {
                            console.error('Error updating article:', err);
                        }
                    }
                } else {
                    try {
                        const updatedArticle = await updateArticleByID(article._id, { drUri: drUri }, true) // Update Article with new drUri
                        console.log(`Article { uuid: ${updatedArticle.uuid} } has been updated succesfully`)
                    } catch (err) {
                        console.error('Error updating article:', err);
                    }
                }

                if (sourceEventArticles.length > 0) {
                    drEvents.push(drUri)
                    let drEvent = new DrEvent({
                        id: uuidv4(),
                        drUri: drUri,
                        savedArticles: sourceEventArticles.length,
                        dateCreated: new Date(),
                    })

                    await saveDocument(drEvent);
                }
            }
        }
    }

    const dr = new DailyRecap({
        id: uuidv4(),
        source: source,
        drEvents: drEvents,
        dateCreated: new Date(),
    })

    try {
        if (dr.drEvents.length > 0) {
            await saveDocument(dr)
            console.log(`DailyRecap ${dr.id} was saved succesfully`)
        } else {
            console.log(`DailyRecap doesnt have any events and therefore wasnt saved to DB`)
        }
    } catch (err) {
        console.error(`There was a problem saving DailyRecap ${dr.id}`)
    }
}

module.exports = {
    createDailyRecap
}