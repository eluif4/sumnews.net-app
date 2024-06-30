// LIBRARIES
const kleur = require('kleur')
const Article = require('../4-models/articles.js')
const Queue = require('../4-models/queue.js')
const Event = require('../4-models/events.js')
const cache = require('memory-cache')

const uuid = require('uuid');
// const { articleQueue } = require('./ServerHelper')
const { saveDocument, getEvents, getAllSources, getEventByEventUri } = require('./db/databaseAccess.js')
const { assignAndSummarize } = require('../2-utils/api/geminiRequests')
const { getArticlesFromEvent } = require('../2-utils/api/getArticlesFromAPI')
const { getAllGenres } = require('../2-utils/db/getCollections')

var isProcessing = false
const articleQueue = new Queue()
// Process ARTICLE QUEUE
async function processQueue() {
    if (!isProcessing) {
        isProcessing = true
        while (!articleQueue.isEmpty()) {
            var now = new Date();
            const article = articleQueue.dequeue()
            if (article.url) {
                console.log(`${now.getHours()}h:${now.getMinutes()}m:${now.getSeconds()}s (${articleQueue.size() + 1}) `
                    + kleur.magenta(`${article.url}`))
                var a = await processArticle(article)
                // If a.summarizedContent isnt empty and hasnt failed in summarization in Gemini
                if (a.summarizedContent && a.summarizedContent != "Error" || a.summarizedContent && a.summarizedContent != "Error.") {
                    try {
                        var hasFullCoverage = false;

                        // If article has eventUri and eventUri includes "eng"
                        if (a.eventUri && a.eventUri.includes("eng")) {
                            hasFullCoverage = await processEvent(a)
                        }

                        // If article doesnt have full coverage give article (a).eventUri value of null
                        if (!hasFullCoverage) {
                            a.eventUri = null
                        }

                        // Save article with the final values
                        await saveDocument(a);
                    } catch (error) {
                        console.error(error, `Couldnt save ${a.collection.modelName} into '${a.collection.name}' collection`)
                    }
                } else {
                    console.log(kleur.bgRed(`Saving failed`))
                }
            }
        }
        isProcessing = false
    }
}

// Goes over given eventUri, get articles, filters them by source and language and add the relevant articles to articlQueue
async function processEvent(article) {
    var doesEventExist = await getEventByEventUri(article.eventUri) // Returns value of event ( is no event return null )

    if (!doesEventExist) {

        const cachedSources = cache.get('sources');
        var allSources = cachedSources ? cachedSources : await getAllSources();

        const eventUri = article.eventUri;
        var sources = allSources.map(source => source.source)
        var articleEventsAddedToQueueCount = 0;

        /* 
        FUTURE CHANGE: I dont get all articles from event due to pagination. 
        The problem isnt vital because most of the events dont have pagination
        I filter out most of the articles due to source and langauge therefore leaving me with only a fue dozen articles per event
        */
        try {
            var response = await getArticlesFromEvent(eventUri); // I dont get the event her but instead get Articles from the event.
            // I need to call POSThttps://eventregistry.org/api/v1/event/getEvent to get information about the event. Usefule for when saving an event

            var eventArticles = response[eventUri].articles.results;
            eventArticles = eventArticles.filter(item => item.url !== article.url);
            // Remove the current url from the eventArticles array
            // const dequeuedArticle = eventArticles.shift()
            // Loop over articles from event to see if they are from a source in my DB
            for (const articleEvent of eventArticles) {
                // If articleEvent is from source in DB add the articleEvent to articleQueue
                // If isnt the current url and is an article from the sources
                if (articleContainsSource(articleEvent, sources)) {
                    articleQueue.moveToFront(articleEvent);
                    articleEventsAddedToQueueCount++;
                }
            }
            console.log(kleur.green(`${articleEventsAddedToQueueCount}/${eventArticles.length} articles added to queue from event ${eventUri}`))
        } catch (error) {
            console.error(`Error processing event`, error)
        }

        const e = new Event({
            // autoNum: events[0] != undefined ? events[0].autoNum + 1 : 0, // Add 1 to the latest eventUri, else set to 0
            eventUri: eventUri,
            articlesCount: response[eventUri].articles.totalResults,
            // FUTURE CHANGE: THE NUMBER BELOW ISNT CORRECT. SAME ARTICLES ARENT SAVE TO DB
            articlesSaved: articleEventsAddedToQueueCount,
            dateCreated: new Date(),
            // socialScore: response[eventUri].socialScore,
            // sentiment: response[eventUri].sentiment,
            // summary: response[eventUri].summary,
            // concepts: response[eventUri].concepts,
        })

        // Save event (e) to DB if there are more than 1 articles in the full coverage
        if (articleEventsAddedToQueueCount >= 1)
            await saveDocument(e);

        return articleEventsAddedToQueueCount >= 1;
    } else {
        return true
    }
}

//---HELPER FUNCTION---
async function processArticle(article) { // Returns the updated article
    // CREATING UUID
    const uuidValue = uuid.v4();

    // INIT ARTICLE
    var a = new Article({
        title: article.title,
        url: article.url,
        source: article.source.uri,
        author: [], //authors,
        datePublished: new Date(article.dateTimePub),
        genre: [], //categoriesArray,
        eventUri: article.eventUri,
        drUri: null,
        content: article.body,
        summarizedContent: '',
        imageUrl: article.image,
        sentiment: article.sentiment,
        concepts: article.concepts,
        links: article.links,
        shares: article.shares,
        uuid: uuidValue
    })

    if (article.body) { // Successful content fetching
        // FIND AUTHORS
        const authorsList = article.authors;
        var authors = [];
        for (const elem of authorsList) {
            authors.push(elem.name)
        }

        a.author = authors;

        // FINDING GENRES USING GEMINI
        try {
            var response = await assignAndSummarize(a)

            var chosenGenres = response.genres.map(item => item.trim())

            const cachedGenres = cache.get('genres');
            var allGenres = cachedGenres ? cachedGenres : await getAllGenres();
            var possibleGenres = allGenres.map(genre => genre.genre)

            var validGenres = [];
            for (const genre of chosenGenres) {
                if (genreExistsInPossibleGenres(genre, possibleGenres))
                    validGenres.push(genre)
            }
            a.genre = validGenres;

            const summary = response.summary
            if (summary) { // Successful summarizing
                a.summarizedContent = summary
            }
        } catch (error) {
            console.error('Couldnt assign / summarize article', error);
        }
    }
    return a;
}

// Check if an article is from a source in my db
function articleContainsSource(article, sources) {
    const articleSourceUri = article.source.uri
    for (const sourceUri of sources) {
        if (sourceUri == articleSourceUri)
            return true;
    }
    return false;
}

// Check if eventUri exists in eventUris array
function eventUriExists(eventUri, events) {
    for (const event of events)
        if (event.eventUri == eventUri)
            return true;
    return false;
}

function genreExistsInPossibleGenres(genre, possibleGenres) {
    for (const pg of possibleGenres) {
        if (pg == genre)
            return true;
    }
    return false;
}

module.exports = {
    processQueue,
    articleQueue,
}