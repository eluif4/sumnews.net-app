const { query } = require('express-validator')

const { Router } = require('express');
const { getArticlesController,
    getArticlesFromSearchController,
    PostArticlesController,
    getEventArticlesController,
    getArticlesFromEventController,
    createDailyRecapController,
    getDailyRecapByIdController,
    getEventByEventUriController,
} = require('../../6-controllers/db/articlesController');

const app = Router();

app.get('/db/GetArticles', getArticlesController)
app.get('/db/search', query('search_query').notEmpty().escape(), getArticlesFromSearchController)
app.post('/db/PostArticlesController', PostArticlesController)
app.get('/db/eventArticles', getEventArticlesController)
app.post('/db/getArticlesFromEvent', getArticlesFromEventController)
app.get('/db/getDailyRecap', createDailyRecapController)
app.post('/db/getDailyRecapById', getDailyRecapByIdController)
app.post('/db/getEventByEventUri', getEventByEventUriController)


module.exports = app;