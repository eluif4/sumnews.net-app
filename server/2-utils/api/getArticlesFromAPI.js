// ----- Newsapi.ai requests ------
// Get all articles from today given the source passed in the function
async function getArticlesUsingSource(
    sources = ['nytimes.com'],
    dateStart,
    dateEnd,
) {
    const endpoint = 'https://newsapi.ai/api/v1/article/getArticles/'
    const method = 'POST';
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }

    resultType = 'articles';
    lang = "eng";
    // var formattedLocations = locations.map(locationUri => ({ "locationUri": `http://en.wikipedia.org/wiki/${locationUri}` }));
    var formattedSources = sources.map(sourceUri => ({ "sourceUri": sourceUri }));
    // var formattedLangs = langs.map(lang => ({ "lang": lang }));

    const date = new Date();
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    month = month < 10 ? '0' + month : month; // Add leading zero if needed
    let day = date.getDate();
    day = day < 10 ? '0' + day : day; // Add leading zero if needed

    if (!dateStart)
        dateStart = `${year}-${month}-${day}`;

    if (!dateEnd)
        dateEnd = `${year}-${month}-${day}`;

    var apiKey = process.env.NEWSAPIAI_KEY;

    var body = {
        "query": {
            "$query": {
                "$and": [
                    // {
                    //     "$or": formattedLocations
                    // },
                    {
                        "$or": formattedSources
                    },
                    // {
                    //     "$or": formattedLangs
                    // },
                    {
                        "dateStart": dateStart,
                        "dateEnd": dateEnd,
                        "lang": lang,
                    }
                ]
            },
            "$filter": {
                "dataType": [
                    "news"
                ]
            }
        },
        "resultType": resultType,
        "articlesSortBy": "date",
        "includeArticleSocialScore": true,
        "includeArticleConcepts": true,
        "includeArticleCategories": true,
        "includeArticleLocation": true,
        "includeArticleImage": true,
        "includeArticleVideos": true,
        "includeArticleLinks": true,
        "includeArticleExtractedDates": true,
        "includeArticleDuplicateList": true,
        "includeArticleOriginalArticle": true,
        "includeConceptImage": true,
        "includeConceptDescription": true,
        "includeConceptSynonyms": true,
        "includeConceptTrendingScore": true,
        "includeSourceDescription": true,
        "includeSourceLocation": true,
        "includeSourceRanking": true,
        "apiKey": apiKey,
    }

    var response = await fetch(endpoint, {
        method: method,
        headers: headers,
        body: JSON.stringify(body),
    })

    var data = await response.json();
    return data;
}

// Get recent activity of all news sources passed into the function
async function getArticlesUsingRecentActiviy(
    sources = ['nytimes.com']
) {
    var formattedSources = sources.map(sourceUri => ({ "sourceUri": sourceUri }));

    const date = new Date();
    const year = date.getFullYear();
    let month = date.getMonth() + 1;
    month = month < 10 ? '0' + month : month; // Add leading zero if needed
    let day = date.getDate();
    day = day < 10 ? '0' + day : day; // Add leading zero if needed

    dateStart = `${year}-${month}-${day}`;
    var lang = "eng";

    var apiKey = process.env.NEWSAPIAI_KEY;

    const endpoint = 'https://newsapi.ai/api/v1/article/getArticles/'
    const method = 'POST';
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }

    const body = {
        "query": {
            "$query": {
                "$and": [
                    {
                        "$or": formattedSources,
                    },
                    {
                        "dateStart": dateStart,
                        "dateEnd": dateStart,
                        "lang": lang,
                    }
                ]
            }
        },
        "resultType": "recentActivityArticles",
        "articlesSortBy": "date",
        "includeArticleSocialScore": true,
        "includeArticleConcepts": true,
        "includeArticleCategories": true,
        "includeArticleLocation": true,
        "includeArticleImage": true,
        "includeArticleVideos": true,
        "includeArticleLinks": true,
        "includeArticleExtractedDates": true,
        "includeArticleDuplicateList": true,
        "includeArticleOriginalArticle": true,
        "includeConceptImage": true,
        "includeConceptDescription": true,
        "includeConceptSynonyms": true,
        "includeConceptTrendingScore": true,
        "includeSourceDescription": true,
        "includeSourceLocation": true,
        "includeSourceRanking": true,
        "apiKey": apiKey,
    }

    var response = await fetch(endpoint, {
        method: method,
        headers: headers,
        body: JSON.stringify(body),
    })

    var data = await response.json();
    return data;
}

async function getArticlesFromEvent(eventUri) {
    try {
        var apiKey = process.env.NEWSAPIAI_KEY;

        const endpoint = 'https://newsapi.ai/api/v1/event/getEvent'
        const method = 'POST';
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }

        const body = {
            "eventUri": [
                eventUri
            ],
            "resultType": "articles",
            "articlesSortBy": "date",
            "includeArticleSocialScore": true,
            "includeArticleConcepts": true,
            "includeArticleCategories": true,
            "includeArticleLocation": true,
            "includeArticleImage": true,
            "includeArticleVideos": true,
            "includeArticleLinks": true,
            "includeArticleExtractedDates": true,
            "includeArticleDuplicateList": true,
            "includeArticleOriginalArticle": true,
            "apiKey": apiKey
        }

        var response = await fetch(endpoint, {
            method: method,
            headers: headers,
            body: JSON.stringify(body),
        })

        // Check if the response is okay (status 200)
        if (!response.ok) {
            throw new Error(`getArticlesFromEvent response isnt 200: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();

        // Validate that articles exist in the response
        if (!data) {
            throw new Error("No articles found for the given event URI.");
        }

        // Return the valid data
        return data;
    } catch (error) {
        console.error(`Failed to fetch articles: ${error.message}`);
        // Return a meaningful error response for the parent function
        return { error: error.message };
    }
}

module.exports = {
    getArticlesUsingSource,
    getArticlesUsingRecentActiviy,
    getArticlesFromEvent,
}