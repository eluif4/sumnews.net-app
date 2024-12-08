const { Router } = require('express');

const app = Router();

const { notificationController, 
    saveNotificationTokenController 
} = require('../6-controllers/notificationController');

app.post('/notification', notificationController);
app.post('/db/saveNotificationToken', saveNotificationTokenController);

module.exports = app;