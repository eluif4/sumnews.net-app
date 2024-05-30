const cron = require("node-cron");
const DailyRecap = require("../4-models/dailyRecap");
const Event = require("../4-models/events");
const { eventsSinceYesterdayByPopularity, saveDocument, getArticlesFromDB, getEvents } = require("./db/databaseAccess");
const { v4: uuidv4 } = require('uuid');
const Article = require("../4-models/events");

async function createDailyRecap(source) {
    // get the top events from the last 24 hours. top articles are defines using totalArticleCount,, relevance
    // get the top articles from each source. top artilces are defined using socialScore, 
    // Most articles interacted with throughout the day. Find which articles have been opened the most and had most screen time
    // relative to the content lenght and showcase those. Add extra to an article if a user went to the original. 
    // FUTURE CHANGE: ADD TRY CATCH
    var events = await eventsSinceYesterdayByPopularity(); // events are sorted by articleCount descending
    var eventUris = [];
    if (source === 'sumnews.net') {
        eventUris = events.slice(0, 5).map(event => event.eventUri) //save only top 5 events
    } else {
        // Yesterday's date
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        // FUTURE CHANGE: AUTONUM VALUES MAY DUPLICATE WHEN AN EVENT IS IN QUEUE AND CREATEDAILYRECAP HAPPENS TO FIRE

        var filter = {
            "source": source,
            "datePublished": { "$gte": new Date(yesterday) }
        }

        const sort = {
            content: -1
        }

        var articles = await getArticlesFromDB(filter, undefined, sort, 0, 5); // returns array of top 5 articles in db form past 24hrs
        events.sort((a, b) => b.autoNum - a.autoNum); // Sorted events for autuNum value
        var sourceEventArticles = [];
        var drUri = '';

        for (const article of articles) {
            drUri = `${source}/${article.uuid}`;
            sourceEventArticles.push(article)

            if (article.eventUri != null) { // if article has eventUri
                drUri = `${source}/${article.eventUri}`; // custom eventUri
                filter = { "source": source, "eventUri": article.eventUri }
                sourceEventArticles = await getArticlesFromDB(filter)
                sourceEventArticles.push(sourceEventArticles)

                Article.findByIdAndUpdate(
                    article._id,
                    { eventUri: drUri },
                    { new: true }, // This option returns the updated document
                    (err, updatedArticle) => {
                        if (err) {
                            console.error('Error updating article:', err);
                        } else {
                            console.log('Updated article:', updatedArticle);
                        }
                    }
                );

                const e = new Event({
                    autoNum: events[0].autoNum, // get auto num
                    eventUri: drUri,
                    articlesCount: sourceEventArticles,
                    articlesSaved: sourceEventArticles,
                    dateCreated: new Date(),
                })
                await saveDocument(e)
            }
            eventUris.push(drUri)
        }
    }
    const dr = new DailyRecap({
        id: uuidv4(),
        source: source,
        events: eventUris,
        dateCreated: new Date(),
    })

    return dr;
}

module.exports = {
    createDailyRecap
}