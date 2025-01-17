const { Router } = require('express');

const app = Router();

const { notificationController, 
    saveNotificationTokenController,
    getTodaysDailyRecapLinkController,
} = require('../6-controllers/notificationController');

app.post('/notification', notificationController);
app.post('/db/saveNotificationToken', saveNotificationTokenController);
app.get('/db/getTodaysDailyRecapLink', getTodaysDailyRecapLinkController);

module.exports = app;