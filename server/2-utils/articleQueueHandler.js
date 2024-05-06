// LIBRARIES
const kleur = require('kleur')
const Article = require('../4-models/articles.js')
const Queue = require('../4-models/queue.js')
const Event = require('../4-models/events.js')

const uuid = require('uuid');
// const { articleQueue } = require('./ServerHelper')
const { saveDocument, getEvents, getAllSources } = require('./db/databaseAccess.js')
const { summarizeArticleWithGemini, assignGenreWithGemini } = require('../2-utils/api/geminiRequests')
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
    /* 
    Get events from DB
    FUTURE CHANGE: With more events in db query times will become longer
    */
    /*
    FUTURE CHANGE: const events = await getEvents(); this line get called eveytime I check if event exists in DB
    This code is redundant and need to be called once to get all events and then run the for loop for validation
    There is no need to access the DB so many times for a simple existance check
    */
    /* 
    FUTURE CHANGE: const sources = await getAllSources(); this line get called everytime I check if event exists in DB
    This code is redudand and needs to be called once to get all sources and then run the validation function
    There is no need to access the DB so many times for a simple existance check
    */
    const events = await getEvents();
    const allSources = (await getAllSources());
    const eventUri = article.eventUri;
    var sources = allSources.map(source => source.sourceName)
    var eventExists = eventUriExists(eventUri, events);
    var articleEventsAddedToQueueCount = 0;

    if (!eventExists) {
        /* 
        FUTURE CHANGE: I dont get all articles from event due to pagination. 
        The problem isnt vital because most of the events dont have pagination
        I filter out most of the articles due to source and langauge therefore leaving me with only a fue dozen articles per event
        */
        try {
            var response = await getArticlesFromEvent(eventUri);
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
            autoNum: events[0] != undefined ? events[0].autoNum + 1 : 0, // Add 1 to the latest eventUri, else set to 0
            eventUri: eventUri,
            articlesCount: response[eventUri].articles.totalResults,
            // FUTURE CHANGE: THE NUMBER BELOW ISNT CORRECT. SAME ARTICLES ARENT SAVE TO DB
            articlesSaved: articleEventsAddedToQueueCount,
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
        source: article.source.title,
        author: [], //authors,
        datePublished: new Date(article.dateTimePub),
        genre: [], //categoriesArray,
        eventUri: article.eventUri,
        content: article.body,
        summarizedContent: '',
        imageUrl: article.image,
        uuid: uuidValue
    })

    if (article.body) { // Successful content fetching
        // FIND AUTHORS
        const authorsList = article.authors;
        var authors = [];
        for (const elem of authorsList) {
            authors.push(elem.name) // FUTURE CHANGE: SAVE AUTHORS INFORMATION IN DB TO ALLOW USERS TO FOLLOW AUTHORS
        }

        a.author = authors;

        // FINDING GENRES - article genres are save in 'categories'
        // const categories = article.categories
        // var categoriesArray = [];
        // for (const c of categories) {
        //     var cLabel = c.label.split('/')[1]
        //     if (!categoriesArray.includes(cLabel)) {
        //         categoriesArray.push(cLabel)
        //     }
        // }

        // if (categoriesArray.length == 0)
        //     categoriesArray.push('World')

        // a.genre = categoriesArray

        // FINDING GENRES USING GEMINI
        var chosenGenres = await assignGenreWithGemini(article)
        var possibleGenres = (await getAllGenres()).map(genre => genre.genre)

        try {
            chosenGenres = chosenGenres.match(/\[([^\[\]]*)\]/)[1].split(',').map(item => item.trim())
        } catch (error) {
            chosenGenres = ['World']
        }

        var validGenres = [];
        for (const genre of chosenGenres) {
            if (genreExistsInPossibleGenres(genre, possibleGenres))
                validGenres.push(genre)
        }
        a.genre = validGenres;

        const summary = (await summarizeArticleWithGemini(a)) // Summarize content
        if (summary) { // Successful summarizing
            a.summarizedContent = summary
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