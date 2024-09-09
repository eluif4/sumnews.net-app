const { Router } = require('express');
const { 
    getUserBookmarksController,
    getUserFeedController
} = require('../../6-controllers/db/userController');

const {
    authenticateToken,
} = require('../../3-middleware/authenticator')

const app = Router();

app.get('/user/bookmarks', authenticateToken, getUserBookmarksController)
app.get('/user/feed', authenticateToken, getUserFeedController)

module.exports = app;