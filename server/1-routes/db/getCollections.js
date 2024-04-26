const { query } = require('express-validator')

const { Router } = require('express');
const { getArticlesController,
    getArticlesFromSearchController,
    PostArticlesController,
    getEventArticlesController,
    getArticlesFromEventController,
} = require('../../6-controller/db/GetArticlesController');

const app = Router();

app.get('/db/GetArticles', getArticlesController)
app.get('/db/search', query('search_query').notEmpty().escape(), getArticlesFromSearchController)
app.post('/db/PostArticlesController', PostArticlesController)
app.get('/db/eventArticles', getEventArticlesController)
app.post('/db/getArticlesFromEvent', getArticlesFromEventController)


module.exports = app;