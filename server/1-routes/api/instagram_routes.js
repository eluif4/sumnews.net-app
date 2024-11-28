const { Router } = require('express');
const { postArticleToInstagramController } = require('../../6-controllers/api/instagram_controller')
const { verifyToken } = require('../../3-middleware/authenticator')


const app = Router();

app.post('/api/postArticleToInstagram', verifyToken, postArticleToInstagramController)

module.exports = app;