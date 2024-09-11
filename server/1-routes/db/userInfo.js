const { Router } = require('express');
const { 
    getUserBookmarksController,
    getUserController,
    getUserFeedController,
    updateUserPreferencesController,
} = require('../../6-controllers/db/userController');

const {
    authenticateToken,
} = require('../../3-middleware/authenticator')

const app = Router();

app.get('/user/bookmarks', authenticateToken, getUserBookmarksController)
app.get('/user', authenticateToken, getUserController)
app.post('/user/feed', authenticateToken, getUserFeedController)
app.post('/user/updatePreferences', authenticateToken, updateUserPreferencesController)

module.exports = app;