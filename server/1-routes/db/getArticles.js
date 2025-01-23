const { query } = require('express-validator')

const { Router } = require('express');
const { getArticlesController,
    getArticlesFromSearchController,
    PostArticlesController,
    getEventArticlesController,
    getArticlesFromEventController,
    getArticlesFromDrEventController,
    createDailyRecapController,
    postDailyRecapsController,
    getDailyRecapsController,
    getDailyRecapButtonsController,
    getDailyRecapByIdController,
    getEventByEventUriController,
    getSourcesLogoController,
    updateArticleEngagementController
} = require('../../6-controllers/db/articlesController');

const { verifyToken } = require('../../3-middleware/authenticator')

const app = Router();

app.get('/db/GetArticles', getArticlesController)
app.post('/db/search', query('search_query').notEmpty().escape(), getArticlesFromSearchController)
app.post('/db/PostArticlesController', PostArticlesController)
app.get('/db/eventArticles', getEventArticlesController)
app.post('/db/getArticlesFromEvent', getArticlesFromEventController)
app.post('/db/getArticlesFromDrEvent', getArticlesFromDrEventController)
app.get('/db/createDailyRecap', createDailyRecapController)
app.post('/db/getDailyRecapById', getDailyRecapByIdController)
app.post('/db/getEventByEventUri', getEventByEventUriController)
app.post('/db/getDailyRecaps', postDailyRecapsController)
app.get('/db/dailyrecap/:uuid', getDailyRecapsController)
app.get('/db/getDailyRecapButtons', getDailyRecapButtonsController)
app.post('/db/getSourcesLogo', getSourcesLogoController)
app.post('/db/updateArticleEngagement', updateArticleEngagementController)


module.exports = app;