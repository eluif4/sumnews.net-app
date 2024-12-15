import router from '../router'
import { config } from '../constants';
import { PopupAttributes, List } from '../main';
import { Preferences } from '@capacitor/preferences'

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
                'Content-Type': 'application/json',
                "Cache-Control": 'no-cache'
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
        console.error(`Error retrieving articles with front_getArticlesFromDB from ${FRONTEND_URL} to ${BACKEND_URL}`, error)
    }
}

export async function fetchFeed(skip = 0) {
    front_getArticlesFromDB(undefined, undefined, undefined, skip, 10)
        .then(response => {
            const articles = response
            for (const article of articles) {
                List.articles.push(article)
            }
        })
}

export async function fetchUserFeed() {
    const token = await getAuthToken();

    fetch(`${BACKEND_URL}user/feed`, {
        method: 'POST',
        headers: {
            "Content-type": "application/json",
            "Authorization": `Bearer ${token}`,
            "Cache-Control": 'no-store'
        },
        body: JSON.stringify({
            articlesInFeed: List.articles.map(article => article.uuid)
        })
    })
        .then(async response => {
            if (response.status === 403) {
                console.error("User isn't logged in");
                // Fall back to default article fetching if the user isn't logged in
                return await front_getArticlesFromDB();
            }
            return response.json();
        })
        .then(data => {
            if (data.articles) {
                for (const article of data.articles) {
                    List.articles.push(article); // Incrementally add articles
                }
            }
        })
        .catch(error => {
            console.error("Error in fetchUserFeed:", error);
        });
}

export async function addArticleToBookmarks(articleuuid) {
    try {
        if (articleuuid) {
            var data = { articleuuid: articleuuid };
            var response = await fetch(`${BACKEND_URL}user/addToBookmark`, {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                    'Authorization': `Bearer ${await getAuthToken()}`
                },
                body: JSON.stringify(data)
            })

            return response;
        } else {
            return { status: 500, message: 'Article wasnt provided' }
        }
    } catch (error) {
        console.error('Failed to add article to bookmarks', error)
    }
}

export async function removeArticleFromBookmarks(articleuuid) {
    try {
        if (articleuuid) {
            var data = { articleuuid: articleuuid };
            var response = await fetch(`${BACKEND_URL}user/removeFromBookmark`, {
                method: 'POST',
                headers: {
                    'Content-type': 'application/json',
                    'Authorization': `Bearer ${await getAuthToken()}`
                },
                body: JSON.stringify(data)
            })

            return response;
        } else {
            return { status: 500, message: 'Article wasnt provided' }
        }
    } catch (error) {
        console.error('Failed to remove article from bookmarks', error)
    }
}

export async function updateArticleEngagement(article, engagementType) {
    try {
        const response = await fetch(`${BACKEND_URL}db/updateArticleEngagement`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                articleuuid: article.uuid, // Send the article UUID
                engagementType: engagementType // Specify the engagement type
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update engagement');
        }
        console.log(`Successfully updated ${engagementType} for article: ${article.title}`);
    } catch (error) {
        console.error('Error updating engagement:', error);
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
            "Authorization": `Bearer ${await getAuthToken()}`,
            "Cache-Control": 'no-store'
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

// Function to store token based on platform
export async function storeAuthToken(token) {
    if (Capacitor.getPlatform() === 'web') {
        // Store token in an HTTP-only cookie
        const date = new Date();
        const maxAge = 5 * 365 * 24 * 60 * 60; // 5 years in seconds
        document.cookie = `authToken=${token}; Max-Age=${maxAge}; Secure; SameSite=Strict; path=/`;
    } else if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
        // Store token in secure storage for native
        await Preferences.set({ key: 'authToken', value: token });
    }
}

// Function to retrieve token based on platform
export async function getAuthToken() {
    if (Capacitor.getPlatform() === 'web') {
        const match = document.cookie.match(/(^|;\s*)authToken=([^;]*)/);
        return match ? match[2] : null; // Retrieve token from cookie
    } else if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
        const { value } = await Preferences.get({ key: 'authToken' });
        return value; // Retrieve token from secure storage
    }
    return null; // Return null if no token is found
}

// Function to remove the auth token based on the platform
export async function removeAuthToken() {
    if (Capacitor.getPlatform() === 'web') {
        // Remove token from cookie
        document.cookie = `authToken=; Max-Age=0; Secure; SameSite=Strict; path=/`;
    } else if (Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios') {
        // Remove token from secure storage for native
        await Preferences.remove({ key: 'authToken' });
    }
}