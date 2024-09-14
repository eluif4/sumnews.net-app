const path = require("path")

const User = require("../../4-models/users")
const UTILS = path.join(__dirname, '../../2-utils')
const DBUTILS = path.join(__dirname, '../../2-utils/db')
const DatabaseAccess = path.join(DBUTILS, "/databaseAccess.js")

const { getUserBookmarks,
    getUserFeed,
    updateUserPreferences,
    addArticleToBookmarks,
    removeArticleToBookmarks
} = require(DatabaseAccess)

async function getUserBookmarksController(req, res) {
    const userBookmarks = await getUserBookmarks(req.user?.googleId);

    if (userBookmarks) {
        res.status(200).json({ wasFound: true, bookmarks: userBookmarks })
    } else {
        res.status(404).json({ wasFound: false, bookmarks: false })
    }
}

async function addArticleToBookmarksController(req, res) {
    try {
        const articleuuid = req.body?.articleuuid;
        const userGoogleId = req.user?.googleId;

        if (articleuuid) {
            await addArticleToBookmarks(userGoogleId, articleuuid);
            res.status(201).json({ message: 'Bookmark added successfully' });
        }
        else {
            res.status(400).json({ message: 'Invalid parameters' });
        }
    } catch (error) {
        console.error('Failed to add article to bookmarks', error)
        res.status(500);
    }
}

async function removeFromBookmarkController(req, res) {
    try {
        const articleuuid = req.body?.articleuuid;
        const userGoogleId = req.user?.googleId;

        if (articleuuid) {
            await removeArticleToBookmarks(userGoogleId, articleuuid);
            res.status(201).json({ message: 'Bookmark removed successfully' });
        }
        else {
            res.status(400).json({ message: 'Invalid parameters' });
        }
    } catch (error) {
        console.error('Failed to remove article from bookmarks', error)
        res.status(500);
    }
}

async function getUserController(req, res) {
    try {
        const googleId = req.user.googleId;
        const user = await User.findOne({ googleId: googleId })

        if (!user) {
            return res.status(404).json({ user: null })
        }

        res.status(200).json({
            user: user
        })
    } catch (error) {
        res.status(500);
    }
}

async function getUserFeedController(req, res) {
    try {
        const googleId = req.user?.googleId;
        const articlesInFeed = req.body.articlesInFeed ? req.body.articlesInFeed : [];

        if (!googleId) { // Check if user is connected in frontend. If for any reason there is an error, return an empty array
            res.status(500).json({ message: 'User isnt logged in', articles: [] })
        }
        else {
            const userFeed = await getUserFeed(googleId, articlesInFeed);
            res.status(200).json({ message: 'Successfully fetched users feed', articles: userFeed })
        }
    } catch (error) {
        console.error('Failed to fetch users feed', error);
    }
}

async function updateUserPreferencesController(req, res) {
    try {
        const googleId = req.user?.googleId;
        const updateBody = req.body;
        // Example: 
        /*
        {
            genres: [
                { name: 'genrename', addClicks: 1 },
                { name: 'genrename2', addClicks: 1 },
                { name: 'genrename3', addClicks: 1 }
                ...
            ],
            source: { name: 'sourcename': addClicks: 1 }
        }
        */

        if (!googleId) {
            res.status(500).json({ message: 'User isnt logged in', articles: [] })
        }
        else {
            await updateUserPreferences(googleId, updateBody);
            res.status(200).json({ message: 'Successfully updated users preferences' });
        }
    } catch (error) {
        console.error('Failed to update user preferences', error);
    }
}

module.exports = {
    getUserBookmarksController,
    addArticleToBookmarksController,
    removeFromBookmarkController,
    getUserController,
    getUserFeedController,
    updateUserPreferencesController
}