// LIBRARIES
const kleur = require('kleur')
const Article = require('../4-models/articles.js')
const Queue = require('../4-models/queue.js')
const Event = require('../4-models/events.js')
const cache = require('memory-cache')

const uuid = require('uuid');
const { saveDocument, getAllSources, getEventByEventUri, getEvents } = require('./db/databaseAccess.js')
const { assignAndSummarize } = require('../2-utils/api/geminiRequests')
const { getArticlesFromEvent } = require('../2-utils/api/getArticlesFromAPI')
const { getAllGenres } = require('../2-utils/db/getCollections')

var isProcessing = false
const articleQueue = new Queue();
var bulkSendArticlesToGeminiQueue = new Queue();
const BULK_SEND_ARTICLE_QUEUE_SIZE = 15;
// Process ARTICLE QUEUE
async function processQueue() {
    if (!isProcessing) {
        isProcessing = true
        while (!articleQueue.isEmpty()) {
            var now = new Date();
            var articlesInEventCountObject = {};
            while (bulkSendArticlesToGeminiQueue.size() < BULK_SEND_ARTICLE_QUEUE_SIZE && !articleQueue.isEmpty()) {
                // Clear articlesInEventCountSet

                const article = articleQueue.dequeue();
                if (article.url) { // If is a real article
                    // Check for an english event, adds all articles in event to queue and save event to DB
                    if (article.eventUri && article.eventUri.includes('eng-')) {
                        // Current: Gets all articles from the event and if there is more than 1 article save the event to DB. This is incorrect because the gemini request can crash or return a faulty summary and therefor articles from the event wont be saved to the DB at all while the event will be.
                        const doesEventExist = await queueArticlesFromEvents(article)
                        if (doesEventExist != true) {
                            articlesInEventCountObject[article.eventUri] = doesEventExist.articlesCount;
                        }
                        // if (!eventIsMoreThan1Article)
                        //     article.eventUri = null;
                    }

                    // FUTURE CHANGE: Check if articles doesnt already exist in queue
                    bulkSendArticlesToGeminiQueue.enqueue(article)
                    console.log(`(${articleQueue.size() + 1}) (${bulkSendArticlesToGeminiQueue.size()}/${BULK_SEND_ARTICLE_QUEUE_SIZE}) -> ${article.url}`)
                }
            }
            await processBulkSendArticlesToGeminiQueue(articlesInEventCountObject);
        }
        isProcessing = false
    }
}

async function processBulkSendArticlesToGeminiQueue(articlesInEventCountObject) {
    /* 
    Goes over all articles in 'bulkSendArticlesToGeminiQueue', 
    adds any events articles to the queue, 
    sends them to Gemini for summarizing and assigning genres and lastly saves each one to DB
    */
    console.log("Processing 'bulkSendArticlesToGeminiQueue'...")
    // Get articles from the queue and clear it - articles[index] contains all the article information from the API response
    const articles = bulkSendArticlesToGeminiQueue.toArray();
    bulkSendArticlesToGeminiQueue.clear();

    const cachedGenres = cache.get('genres');
    var allGenres = cachedGenres ? cachedGenres : await getAllGenres();
    var possibleGenres = allGenres.map(genre => genre.genre)

    // A Set to store unique event URIs and a Map to track valid articles per event URI
    const eventUris = new Set();
    const eventArticlesSavedMap = new Map();

    try {
        const geminiResponse = await assignAndSummarize(articles);

        // Process each article response from Gemini
        console.log(geminiResponse.response.length);
        for (const [index, originalArticle] of articles.entries()) {
            // Find the matching Gemini article by URL
            const geminiArticle = geminiResponse.response.find(
                (article) => article.url === originalArticle.url
            );

            // If a matching Gemini article is found, proceed
            if (geminiArticle) {
                // Assign and validate genres
                const chosenGenres = geminiArticle.genres.map(item => item.trim());
                const validGenres = chosenGenres.filter(genre => possibleGenres.includes(genre));

                // Assign and validate summary
                const summary = geminiArticle.summary;
                const hasValidGenres = validGenres.length > 0;
                const hasValidSummary = summary && summary !== "undefined" && summary.trim() !== "";

                // Only save if article has valid summary and genres
                if (hasValidGenres && hasValidSummary) {
                    originalArticle.summarizedContent = summary;
                    originalArticle.genre = validGenres;

                    // Save article to DB
                    try {
                        await saveArticle(originalArticle);

                        // Check for eventUri and add to eventUris and eventArticlesSavedMap if criteria are met
                        if (originalArticle.eventUri && originalArticle.eventUri.includes('eng-')) {
                            eventUris.add(originalArticle.eventUri);
                            eventArticlesSavedMap.set(
                                originalArticle.eventUri,
                                (eventArticlesSavedMap.get(originalArticle.eventUri) || 0) + 1
                            );
                        }
                    } catch (error) {
                        console.error(`Saving failed for article -> ${originalArticle.url}`, error);
                    }
                } else {
                    console.log('FAILED to assign and summarize articles', originalArticle.url);
                }
            } else {
                console.log(`${originalArticle.url} does not match any Gemini response URL`);
            }
        }

        // After processing all articles, check and save unique events with their article counts
        if (eventUris.size > 0) {
            const existingEvents = await getEvents({ eventUri: { $in: Array.from(eventUris) } });
            const existingEventUris = new Set(existingEvents.map(event => event.eventUri));
            // Save only new events iwth accurate article counts
            for (const eventUri of eventUris) {
                if (!existingEventUris.has(eventUri) && eventArticlesSavedMap.get(eventUri) > 1) {
                    try {
                        const event = new Event({
                            eventUri,
                            articlesCount: articlesInEventCountObject[eventUri] || eventArticlesSavedMap.get(eventUri),
                            articlesSaved: eventArticlesSavedMap.get(eventUri) || 0,
                            dateCreated: new Date(),
                        })

                        await saveDocument(event);
                    } catch (error) {
                        console.error(`FAILED to save event -> ${eventUri}`, error);
                    }
                }
            }
        }

        console.log("Complete precessing batch of 'bulkSendArticleToGeminiQueue")
    } catch (err) {
        console.error('FAILED to assign and summarize articles', err)
    }
}

// Goes over given eventUri, get articles, filters them by source and language and add the relevant articles to articleQueue
async function queueArticlesFromEvents(article) {
    var doesEventExist = await getEventByEventUri(article.eventUri) // Returns value of event ( is no event return null )
    var eventArticles = [];
    if (!doesEventExist) {

        const cachedSources = cache.get('sources');
        var allSources = cachedSources ? cachedSources : await getAllSources();
        var sources = allSources.map(source => source.source)

        const eventUri = article.eventUri;
        var articleEventsAddedToQueueCount = 0;

        /* 
        FUTURE CHANGE: I dont get all articles from event due to pagination. 
        The problem isnt vital because most of the events dont have pagination
        I filter out most of the articles due to source and langauge therefore leaving me with only a fue dozen articles per event
        */
        try {
            var response = await getArticlesFromEvent(eventUri); // I dont get the event here but instead get Articles from the event.
            // I need to call POST https://eventregistry.org/api/v1/event/getEvent to get information about the event. Usefule for when saving an event

            if (!response.error) {
                eventArticles = response[eventUri].articles.results;
                // Remove the current url from the eventArticles array
                // eventArticles = eventArticles.filter(item => item.url !== article.url);
                // Loop over articles from event to see if they are from a source in my DB
                for (const articleEvent of eventArticles) {
                    // If articleEvent is from source in DB add the articleEvent to articleQueue
                    // If isnt the current url and is an article from the sources
                    if (articleContainsSource(articleEvent, sources) && !articleQueue.exist(articleEvent) && !bulkSendArticlesToGeminiQueue.exist(articleEvent)) {
                        bulkSendArticlesToGeminiQueue.enqueue(articleEvent);
                        articleEventsAddedToQueueCount++;
                        console.log(`Event Article ${articleEvent.url} has been added to 'bulkSendArticlesToGeminiQueue' (${bulkSendArticlesToGeminiQueue.size()}/${BULK_SEND_ARTICLE_QUEUE_SIZE})`)
                    }
                }
                console.log(kleur.green(`${articleEventsAddedToQueueCount}/${eventArticles.length} articles added to queue from event ${eventUri}`))
            } else {
                throw new Error(`Failed to get articles from event: ${response.error}`);
            }

            // const e = new Event({
            //     eventUri: eventUri,
            //     articlesCount: response[eventUri].articles.totalResults ? response[eventUri].articles.totalResults : -1,
            //     articlesSaved: articleEventsAddedToQueueCount,
            //     dateCreated: new Date(),
            // })

            // // Save event (e) to DB if there are more than 1 articles in the full coverage
            // if (articleEventsAddedToQueueCount >= 1)
            //     await saveDocument(e);

            return { success: true, articlesCount: response[eventUri].articles.totalResults || 0 };
        } catch (error) {
            console.error(`Error processing event`, error);
            return { success: false, articlesCount: -1 };
        }
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