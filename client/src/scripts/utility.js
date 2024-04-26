import axios from 'axios' // FUTURE CHANGE: remove and use fetch instead
import router from '../router'
import { config } from '../constants';
// import { AllArticlesHaveBeenDisplayed, NoMatchingArticlesHaveBeenFound } from './errorArticles' // FUTURE CHANGE: show a popup instead of these articles

export function goBack() {
    if (router) {
        router.go(-1);
    }
}

const FRONTEND_URL = config.url.FRONTEND_URL
const BACKEND_URL = config.url.BACKEND_URL

export async function front_getArticlesFromDB(
    /* Send a request to backend with function params as body and 
    backend sends back articles received from the respective function param query */
    filter = {},
    project = {},
    sort = { "datePublished": -1 },
    skip = 0,
    limit = 10
) {
    const search_query = filter.search ? filter.search.trim() : '';
    const searchRegex = new RegExp(search_query, 'i');

    var updatedFilter

    updatedFilter = {
        ...Object.entries(filter).reduce((acc, [key, value]) => {
            if (key == 'genre' || key == 'source')
                acc[key] = value !== 'All' ? value : undefined;
            else if (key == 'search')
                acc[key] = value !== '' ? {
                    $or: [
                        { title: { $regex: searchRegex.source, $options: 'i' } },
                        { source: { $regex: searchRegex.source, $options: 'i' } },
                        { author: { $regex: searchRegex.source, $options: 'i' } },
                        { genre: { $regex: searchRegex.source, $options: 'i' } },
                    ]
                } : undefined
            else
                acc[key] = value
            return acc;
        }, {}),
    };
    try {
        const articles = await axios.post(`${BACKEND_URL}/db/PostArticlesController`, {
            filter: updatedFilter,
            project: project,
            sort: sort,
            // collation: collation,
            skip: skip,
            limit: limit,
        })

        if (skip == 0 && articles.data.length == 0) { // No matching articles found error
            // articles.data.push(NoMatchingArticlesHaveBeenFound)
            return articles
        } else if ((skip > 0 && articles.data.length == 0) || (skip == 0 && articles.data.length < limit)) { // All articles have been displayed error
            // articles.data.push(AllArticlesHaveBeenDisplayed)
            return articles
        }
        return articles
    } catch (error) {
        console.error('Error retrieving articles with front_getArticlesFromDB', error)
    }
}