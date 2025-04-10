import router from '../router'
import { ref } from 'vue'
import { config } from '../constants';
import { PopupAttributes, List } from '../main';
import { Preferences } from '@capacitor/preferences'

const FRONTEND_URL = config.url.FRONTEND_URL;
const BACKEND_URL = config.url.BACKEND_URL;

const platform = ref(Capacitor.getPlatform());

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
        // console.log(`Successfully updated ${engagementType} for article: ${article.title}`);
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
    if (platform.value === 'web') {
        // Store token in an HTTP-only cookie
        const date = new Date();
        const maxAge = 1 * 365 * 24 * 60 * 60; // 1 years in seconds
        document.cookie = `authToken=${token}; Max-Age=${maxAge}; Secure; SameSite=Strict; path=/`;
    } else if (platform.value === 'android' || platform.value === 'ios') {
        // Store token in secure storage for native
        await Preferences.set({ key: 'authToken', value: token });
    }
}

// Function to retrieve token based on platform
export async function getAuthToken() {
    if (platform.value === 'web') {
        const match = document.cookie.match(/(^|;\s*)authToken=([^;]*)/);
        return match ? match[2] : null; // Retrieve token from cookie
    } else if (platform.value === 'android' || platform.value === 'ios') {
        const { value } = await Preferences.get({ key: 'authToken' });
        return value; // Retrieve token from secure storage
    }
    return null; // Return null if no token is found
}

// Function to remove the auth token based on the platform
export async function removeAuthToken() {
    if (platform.value === 'web') {
        // Remove token from cookie
        document.cookie = `authToken=; Max-Age=0; Secure; SameSite=Strict; path=/`;
    } else if (platform.value === 'android' || platform.value === 'ios') {
        // Remove token from secure storage for native
        await Preferences.remove({ key: 'authToken' });
    }
}

export function setCookie(name, value, days) {
    if (platform.value === 'web') {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000); // Convert days to milliseconds
        const expires = "expires=" + date.toUTCString();
        document.cookie = `${name}=${value}; ${expires}; path=/;`;
    } else if (platform.value === 'android' || platform.value === 'ios') {
        Preferences.set({ key: name, value: value }).then(() => {
            console.log(`Cookie ${name} set to ${value}`);
        })
    }
}

export function getCookie(name) {
    if (platform.value === 'web') {
        const cookies = document.cookie.split("; ");
        for (let i = 0; i < cookies.length; i++) {
            const [key, value] = cookies[i].split("=");
            if (key === name) {
                return value;
            }
        }
        return null; // Return null if the cookie is not found
    } else if (platform.value === 'android' || platform.value === 'ios') {
        return Preferences.get({ key: name }).then(({ value }) => value ? value : null); // Retrieve token from secure storage
    }
}

// Sets Daily Recap buttons if need to. 
export async function setDailyRecapButtons() {
    try {
        // Check if there are no dailyRecaps in localStorage or if there needs to be an update
        if (!localStorage.getItem('dailyRecaps') || needsUpdate) {
            var response = await fetch(`${BACKEND_URL}db/getDailyRecapButtons`);
            if (!response.status == 200) { // If request isnt successful
                hasFetchedDailyRecapFinished.value = true;
                showPopup(2, 'Sorry, something went wrong with the Daily Recaps. Please try again later');
            } else {
                var dailyRecaps = await response.json();

                // If now is before 1805 UTCC, set lastUpdate to yesterday at 1805 UTC
                // Step 1: Get the current time in UTC
                const now = new Date();

                // Step 2: Create a target time for 18:05 UTC
                const targetTime = new Date();
                targetTime.setUTCHours(18, 5, 0, 0); // Set time to 18:05:00.000 UTC

                // Compare the current time with the target time
                const isBefore1805UTC = now < targetTime;

                var lastUpdate = new Date();

                if (isBefore1805UTC) {
                    const yesterday1805UTC = new Date();
                    yesterday1805UTC.setUTCDate(now.getUTCDate() - 1); // Move the date back by one day
                    yesterday1805UTC.setUTCHours(18, 5, 0, 0); // Set the time to 18:05:00.000 UTC
                    lastUpdate = yesterday1805UTC;
                } else {
                    var UTC1805 = new Date(Date.UTC(
                        new Date().getUTCFullYear(),  // Current year
                        new Date().getUTCMonth(),     // Current month
                        new Date().getUTCDate(),      // Current date
                        18,                           // Hours in UTC (18:05 UTC)
                        5                             // Minutes in UTC
                    ));
                    lastUpdate = UTC1805
                }

                localStorage.setItem('dailyRecaps', JSON.stringify({ "lastUpdate": lastUpdate, "dailyRecapButtons": dailyRecaps }));
                return dailyRecaps;
            }
        }
    } catch (error) {
        console.error(`Failed to fetch Daily Recaps`, error)
    }
}