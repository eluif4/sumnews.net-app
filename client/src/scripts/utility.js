import router from '../router'
import { config } from '../constants';
import { PopupAttributes } from '../main';

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

// ----- ACTION FUNCTIONS -----
export const actionShareFunction = async (article) => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: `Check out this article on sumnews\n${article.title}`,
                text: `I found an interesting article on sumnews from ${article.source}.`,
                url: `${FRONTEND_URL}article/${article.uuid}`,
            });
        } catch (error) {
            console.error('Error sharing:', error.message);
            // showPopup(2)
        }
    } else {
        if (window.isSecureContext) {
            navigator.clipboard.writeText(`Checkout this article on sumnews\n${FRONTEND_URL}article/${props.article.uuid}`)
            showPopup(1, "Link copied to clipboard succesfully")
        } else {
            showPopup(2, "Oops, something went wrong...")
        }
    }
}

export function bookmarkActionFunction() {
    showPopup(1, "Your article has been bookmarked succesfully")
}

export function fullCoverageActionFunction(article) {
    router.push(`/event/${article.eventUri}`)
}

export function goBack() {
    if (router) {
        router.go(-1);
    }
}

export function showPopup(methodValue, msg, showTime = 3) {
    PopupAttributes.methodValue = methodValue
    PopupAttributes.msg = msg

    setTimeout(() => {
        PopupAttributes.methodValue = -1
    }, 1000 * showTime)
}