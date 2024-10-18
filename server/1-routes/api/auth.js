const { Router } = require('express');
const { googleAuth } = require('../../6-controllers/api/auth');

const app = Router();

app.post('/auth/google', googleAuth);

module.exports = app;