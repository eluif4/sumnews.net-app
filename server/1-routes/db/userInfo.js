const { Router } = require('express');
const {
    getUserBookmarksController,
    addArticleToBookmarksController,
    removeFromBookmarkController,
    getUserController,
    getUserFeedController,
    updateUserPreferencesController,
} = require('../../6-controllers/db/userController');

const {
    authenticateToken,
} = require('../../3-middleware/authenticator')

const app = Router();

app.get('/user/bookmarks', authenticateToken, getUserBookmarksController);
app.post('/user/addToBookmark', authenticateToken, addArticleToBookmarksController);
app.post('/user/removeFromBookmark', authenticateToken, removeFromBookmarkController);
app.get('/user', authenticateToken, getUserController);
app.post('/user/feed', authenticateToken, getUserFeedController);
app.post('/user/updatePreferences', authenticateToken, updateUserPreferencesController);

module.exports = app;