const { saveDocument, getArticlesFromDB, getEvents, updateArticleByID } = require("./db/databaseAccess");
const { v4: uuidv4 } = require('uuid');
const DrEvent = require('../4-models/drEvents')
const DailyRecap = require("../4-models/dailyRecap");

// Yesterday's date
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1)
yesterday.toISOString()

async function createDailyRecap(source) {
    console.log(`Creating Daily Recap for ${source}`)
    var drEvents = [];

    if (source === 'sumnews.net') {
        var filter = {
            "dateCreated": {
                "$gte": yesterday,
            }
        }

        var sort = { "articlesCount": -1 }
        var events = await getEvents(filter, undefined, sort, 0, 5)
        var eventUris = events.map(event => event.eventUri)

        for (const eventUri of eventUris) { // Loop over events
            let drUri = `${source}_${uuidv4()}` // Create drUri

            // Get Event Articles from DB
            let articles = await getArticlesFromDB({ eventUri: eventUri }, undefined, { datePublished: -1 }, 0, 0)
            for (const article of articles) { // Loop over articles: update drUri property to the new drUri value (sumnews.net-uuid)
                try {
                    if (!article.drUri) {
                        let updatedArticle = await updateArticleByID(article._id, { drUri: drUri })
                        console.log(`Article { uuid: ${updatedArticle.uuid} } has been updated succesfully`)
                    } else {
                        console.log(`Didnt update Article { uuid: ${article.uuid} } since it always has a drUri`)
                    }
                } catch (err) {
                    console.log(`Couldnt update article { uuid: ${article.uuid} }`)
                }
            }

            if (articles.length > 0) { // If there are articles in event
                drEvents.push(drUri) // Add drUri to array of drEvents (for the dailyRecap object)
                let drEvent = new DrEvent({
                    id: uuidv4(),
                    drUri: drUri,
                    savedArticles: articles.length, // Articles: {drUri: 'sumnews.net_12e4c951-51e1-4a47-b2a9-0da3a311da48'} return 63 documents | DrEvent { id: 'c3ed8b0d-f422-4966-b236-bfdff208999e' } .savedArticles = 46
                    dateCreated: new Date(),
                })

                await saveDocument(drEvent);
            }
        }
    } else { // If source !== sumnews.net
        var filter = {
            "source": source,
            "datePublished": { "$gte": yesterday },
            "drUri": null
        }

        const sort = {
            content: -1
        }

        // Array of 5 longest articles in db from past 24 hours that dont have a drUri
        var articles = await getArticlesFromDB(filter, undefined, sort, 0, 5);
        var sourceEventArticles;
        for (const article of articles) {
            console.log(`uuid: ${article.uuid} { drUri: ${article.drUri} }`)
            sourceEventArticles = [];
            let drUri = `${source}_${uuidv4()}` // Create drUri

            if (article.eventUri != null) { // If Article is part of an Event
                filter = {
                    "source": source,
                    "eventUri": article.eventUri,
                    "drUri": null
                }

                sourceEventArticles = await getArticlesFromDB(filter) // Get all Article documents in source with same eventUri

                for (const article of sourceEventArticles) { // Loop over all Article in source with same eventUri
                    try {
                        const updatedArticle = await updateArticleByID(article._id, { drUri: drUri }, true)
                        console.log(`Article { uuid: ${updatedArticle.uuid} } has been updated succesfully`)
                    } catch (err) {
                        console.error('Error updating article:', err);
                    }
                }
            }
            else { // If article isnt part of an Event
                try {
                    const updatedArticle = await updateArticleByID(article._id, { drUri: drUri }, true)
                    sourceEventArticles.push(updatedArticle) // Add updated articles to sourceEventArticles to save in dailyrecap
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

    await deleteDailyRecap({ source: source });

    const dr = new DailyRecap({
        id: uuidv4(),
        source: source,
        drEvents: drEvents,
        dateCreated: new Date(),
    })

    try {
        if (dr.drEvents.length > 0) {
            await saveDocument(dr);
            console.log(`DailyRecap (${dr.source})${dr.id} was saved succesfully`);
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


async function deleteAllDailyRecaps() {
    try {
        await DailyRecap.deleteMany({})
        console.log('Deleted all DailyRecaps')
    } catch (err) {
        console.error('Error deleting all DailyRecaps', err)
    }
}

module.exports = {
    createDailyRecap,
    deleteAllDailyRecaps,
    deleteDailyRecap
}