import router from '../router'
import { config } from '../constants';
import { PopupAttributes } from '../main';
import { List } from '../main';

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
        // const articles = await axios.post(`${BACKEND_URL}db/PostArticlesController`, {
        const articles = await fetch(`${BACKEND_URL}db/PostArticlesController`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                filter: updatedFilter,
                project: project,
                sort: sort,
                // collation: collation,
                skip: skip,
                limit: limit
            })
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })

        if (skip == 0 && articles.length == 0) { // No matching articles found error
            // articles.data.push(NoMatchingArticlesHaveBeenFound)
            return articles
        } else if ((skip > 0 && articles.length == 0) || (skip == 0 && articles.length < limit)) { // All articles have been displayed error
            // articles.data.push(AllArticlesHaveBeenDisplayed)
            return articles
        }
        return articles
    } catch (error) {
        console.error('Error retrieving articles with front_getArticlesFromDB', error)
    }
}

export function goBack() {
    if (router) {
        if (router.options.history.state.back != null)
            router.go(-1);
        else
            router.push({ name: 'home' })
    }
}

export function showPopup(methodValue, msg, showTime = 3) {
    PopupAttributes.methodValue = methodValue
    PopupAttributes.msg = msg

    setTimeout(() => {
        PopupAttributes.methodValue = -1
    }, 1000 * showTime)
}

export async function fetchProtectedResource(path) {
    // Path param: everything after www.sumnews.net/ ( example: account/bookmark )
    var response = await fetch(`${BACKEND_URL}user/feed`, {
        method: 'POST',
        headers: {
            "Content-type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
            articlesInFeed: List.articles.map(article => article.uuid)
        })
    });

    // Check if the response is forbidden (status 403)
    if (response.status === 403) {
        console.error("Resource forbidden");
        // Handle the forbidden case, e.g., return an error message or redirect the user
        return; // Stop further execution if needed
    }

    var data = await response.json();
    return data;
}