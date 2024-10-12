const { Router } = require('express');
const { googleAuth, nativeGoogleAuth } = require('../../6-controllers/api/auth');

const app = Router();

app.post('/auth/google', googleAuth);
app.post('/auth/nativeGoogle', nativeGoogleAuth)

module.exports = app;