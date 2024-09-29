// LIBRARIES
const kleur = require('kleur')
const Article = require('../4-models/articles.js')
const Queue = require('../4-models/queue.js')
const Event = require('../4-models/events.js')
const cache = require('memory-cache')

const uuid = require('uuid');
const { saveDocument, getAllSources, getEventByEventUri } = require('./db/databaseAccess.js')
const { assignAndSummarize } = require('../2-utils/api/geminiRequests')
const { getArticlesFromEvent } = require('../2-utils/api/getArticlesFromAPI')
const { getAllGenres } = require('../2-utils/db/getCollections')

var isProcessing = false
const articleQueue = new Queue();
var bulkSendArticlesToGeminiQueue = new Queue();
const BULK_SEND_ARTICLE_QUEUE_SIZE = 20;
// Process ARTICLE QUEUE
async function processQueue() {
    if (!isProcessing) {
        isProcessing = true
        while (!articleQueue.isEmpty()) {
            var now = new Date();
            // Add 10 articles ( without counting events into 'bulkSendArticlesToGeminiQueue' )
            while (bulkSendArticlesToGeminiQueue.size() < BULK_SEND_ARTICLE_QUEUE_SIZE && !articleQueue.isEmpty()) {
                const article = articleQueue.dequeue();
                if (article.url) { // If is a real article
                    // Check for an event, adds all articles in found event to queue and save event to DB
                    if (article.eventUri) {
                        const eventIsMoreThan1Article = await processEvent(article)
                        if (!eventIsMoreThan1Article)
                            article.eventUri = null;
                    }
                    bulkSendArticlesToGeminiQueue.enqueue(article)
                    console.log(`(${articleQueue.size() + 1}) (${bulkSendArticlesToGeminiQueue.size()}/${BULK_SEND_ARTICLE_QUEUE_SIZE}) -> ${article.url}`)
                }
            }

            await processBulkSendArticlesToGeminiQueue();
        }
        isProcessing = false
    }
}

async function processBulkSendArticlesToGeminiQueue() {
    /* 
    Goes over all articles in 'bulkSendArticlesToGeminiQueue', 
    adds any events articles to the queue, 
    sends them to Gemini for summarizing and assigning genres and lastly saves each one to DB
    */
    console.log("Processing 'bulkSendArticlesToGeminiQueue'...")
    // Get all articles in event ( should always be 10 )
    const articles = bulkSendArticlesToGeminiQueue.toArray();
    bulkSendArticlesToGeminiQueue.clear();
    const cachedGenres = cache.get('genres');
    var allGenres = cachedGenres ? cachedGenres : await getAllGenres();
    var possibleGenres = allGenres.map(genre => genre.genre)

    try {
        const gemini_response = await assignAndSummarize(articles);
        for (const [index, gemini_response_article] of gemini_response.entries()) {
            const articleFromBulkQueue = articles[index]
            // If there is an article in the bulk queue and the response article from Gemini has the same url apply the changes
            if (articleFromBulkQueue && articleFromBulkQueue.url == gemini_response_article.url) {

                // Save the assigned genres to article
                var chosenGenres = gemini_response_article.genres.map(item => item.trim())

                var validGenres = [];
                for (const genre of chosenGenres) {
                    if (genreExistsInPossibleGenres(genre, possibleGenres))
                        validGenres.push(genre)
                }

                var canSaveArticle = false;
                const summary = gemini_response_article.summary;

                // If genres is more than 1 and summary is correct ( not undefined or empty)
                canSaveArticle = (validGenres?.length) > 0 && (summary && summary != "undefined" && summary != undefined && summary != "");

                if (canSaveArticle) {
                    // Save the summarized content to article
                    articleFromBulkQueue.summarizedContent = summary
                    articleFromBulkQueue.genre = validGenres;

                    // Save article to DB
                    try {
                        await saveArticle(articleFromBulkQueue);
                    } catch (error) {
                        console.error(`Saving failed for article -> ${articleFromBulkQueue.url}`, error)
                    }
                }
                else {
                    console.log('FAILED to assign and summarize articles')
                }
            } else {
                console.log(`${articleFromBulkQueue.url} doesnt match its original url`)
            }
        }
    } catch (err) {
        console.error('FAILED to assign and summarize articles', err)
    }
}

// Goes over given eventUri, get articles, filters them by source and language and add the relevant articles to articleQueue
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
                if (articleContainsSource(articleEvent, sources) && !articleQueue.exist(articleEvent) && !bulkSendArticlesToGeminiQueue.exist(articleEvent)) {
                    bulkSendArticlesToGeminiQueue.enqueue(articleEvent);
                    articleEventsAddedToQueueCount++;
                    console.log(`Event Article ${articleEvent.url} has been added to 'bulkSendArticlesToGeminiQueue' (${bulkSendArticlesToGeminiQueue.size()}/10)`)
                }
            }
            console.log(kleur.green(`${articleEventsAddedToQueueCount}/${eventArticles.length} articles added to queue from event ${eventUri}`))
        } catch (error) {
            console.error(`Error processing event`, error)
        }

        const e = new Event({
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
async function saveArticle(article) { // Returns the updated article
    // CREATING UUID
    const uuidValue = uuid.v4();

    // INIT ARTICLE
    var a = new Article({
        title: article.title,
        url: article.url,
        source: article.source.uri,
        author: article.authors.map(elem => elem.name), //authors,
        datePublished: new Date(article.dateTimePub),
        genre: article.genre, //categoriesArray,
        eventUri: article.eventUri ? article.eventUri : null,
        drUri: null,
        // content: article.body,
        articleCharCount: article.body.length,
        summarizedContent: article.summarizedContent,
        imageUrl: article.image,
        sentiment: article.sentiment,
        concepts: article.concepts,
        links: article.links,
        // shares: article.shares,
        uuid: uuidValue,
        // No need to specify engagements, it will default to { clicks: 0, shares: 0, originalArticleReads: 0 }
    })

    await saveDocument(a);
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