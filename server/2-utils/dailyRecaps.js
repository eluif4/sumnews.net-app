const cron = require("node-cron");
const DailyRecap = require("../4-models/dailyRecap");
const { eventsSinceYesterdayByPopularity } = require("./db/databaseAccess");
const { v4: uuidv4 } = require('uuid');

async function createDailyRecap() {
    // get the top events from the last 24 hours. top articles are defines using totalArticleCount,, relevance
    // get the top articles from each source. top artilces are defined using socialScore, 
    const events = await eventsSinceYesterdayByPopularity()

    const dr = new DailyRecap({
        id: uuidv4(),
        events: events,
        dateCreated: new Date(),
    })

    return dr;
}

module.exports = {
    createDailyRecap
}