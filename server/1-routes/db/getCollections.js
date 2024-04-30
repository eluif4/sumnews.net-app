const { Router } = require('express');
const { getSourcesController,
    getGenresController
} = require('../../6-controllers/db/articlesController');

const app = Router();

app.get('/db/getAllSources', getSourcesController)
app.get('/db/getAllGenres', getGenresController)

module.exports = app;