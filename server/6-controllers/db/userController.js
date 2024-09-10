const path = require("path")

const User = require("../../4-models/users")
const UTILS = path.join(__dirname, '../../2-utils')
const DBUTILS = path.join(__dirname, '../../2-utils/db')
const DatabaseAccess = path.join(DBUTILS, "/databaseAccess.js")

const { getUserBookmarks, getUserFeed } = require(DatabaseAccess)

async function getUserBookmarksController(req, res) {
    const userBookmarks = await getUserBookmarks(req.body?.googleId);

    if (userBookmarks) {
        res.status(200).json({ wasFound: true, bookmarks: userBookmarks })
    } else {
        res.status(404).json({ wasFound: false, bookmarks: false })
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
        const googleId = req.body?.googleId;

        if (!googleId) { // Check if user is connected in frontend. If for any reason there is an error, return an empty array
            res.status(500).json({ message: 'User isnt logged in', articles: [] })
        }

        const userFeed = await getUserFeed(googleId);
        res.status(200).json({ message: 'Successfully fetched users feed', articles: userFeed })
    } catch (error) {
        console.error('Failed to fetch users feed', error);
    }
}

module.exports = {
    getUserBookmarksController,
    getUserController,
    getUserFeedController,
}