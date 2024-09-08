const path = require("path")

const User = require("../../4-models/users")
const UTILS = path.join(__dirname, '../../2-utils')
const DBUTILS = path.join(__dirname, '../../2-utils/db')
const DatabaseAccess = path.join(DBUTILS, "/databaseAccess.js")

const { getUserBookmarks } = require(DatabaseAccess)

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

module.exports = {
    getUserBookmarksController,
    getUserController,
}