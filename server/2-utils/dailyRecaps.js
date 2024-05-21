const cron = require("node-cron");
const DailyRecap = require("../4-models/dailyRecap");
const { eventsSinceYesterdayByPopularity } = require("./db/databaseAccess");
const { v4: uuidv4 } = require('uuid');

async function createDailyRecap(source) {
    // get the top events from the last 24 hours. top articles are defines using totalArticleCount,, relevance
    // get the top articles from each source. top artilces are defined using socialScore, 

    // FUTURE CHANGE: ADD TRY CATCH
    var events = await eventsSinceYesterdayByPopularity(source)
    var eventUris = events.slice(0, 5).map(event => event.eventUri) //save only top 5 events
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