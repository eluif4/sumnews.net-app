const { messaging } = require('firebase-admin');
const { getUserNotificationToken, saveUserNotificationToken } = require('../2-utils/db/databaseAccess');

async function notificationController(req, res) {
    const messageTitle = req.body.title || "You have a notification!";
    const messageBody = req.body.body || "This is the notification body. Click here to see more information.";
    try {
        const fcmToken = await getUserNotificationToken();

        if (fcmToken) { // If token is received
            const message = {
                token: fcmToken,
                notification: {
                    title: messageTitle,
                    body: messageBody,
                },
            };

            const response = await messaging.send(message);

            console.log(response)
            res.send({ status: 200, message: 'Notification sent'});
        }
    } catch (error) {
        console.log('FAILED to send notification', error);
        res.send({ status: 404, message: 'Failed to send notification'});
    }
}

async function saveNotificationTokenController(req, res) {
    const fcmtoken = req.body.fcmToken;
    const userid = req.body.userid; // Fixed typo here (`req.boyd` to `req.body`)
    console.log(fcmtoken, userid);

    try {
        const response = await saveUserNotificationToken(fcmtoken, userid); // Assuming this is the correct order of arguments

        if (response) { // If user was successfully found and token saved
            res.status(200).send({ message: 'FCM Token saved' });
        } else { // If user was not found
            res.status(404).send({ message: 'User not found, FCM Token not saved' });
        }
    } catch (error) {
        console.error('Error saving FCM Token:', error);
        res.status(500).send({ message: 'Internal server error' });
    }
}

module.exports = {
    notificationController,
    saveNotificationTokenController
}