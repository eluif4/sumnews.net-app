const { messaging } = require('firebase-admin');
const { getUserNotificationToken, saveUserNotificationToken, getAllFCMTokens } = require('../2-utils/db/databaseAccess');
const { sendNotification } = require('../2-utils/notifications/notification');

async function notificationController(req, res) {
    const messageTitle = req.body.title || "You have a notification!";
    const messageBody = req.body.body || "Click here to see more information.";

    try {
        const fcmToken = await getUserNotificationToken(); // Assuming this is a function to get the FCM token

        if (fcmToken) { // If token is successfully retrieved
            const message = {
                token: fcmToken, // Target device token
                notification: {
                    title: messageTitle, // Notification title
                    body: messageBody,   // Notification body
                },
                android: {
                    notification: {
                        icon: 'ic_notification', // Icon name (without extension) should be placed in Android 'res/drawable'
                        color: "#000000"         // Optional: Notification Color Icon (usually black or app-specific theme color)
                    }
                },
            };

            // Sending the notification using Firebase Admin SDK
            const response = await messaging.send(message);

            console.log('Notification sent:', response); // Log successful response

            // Send response to the client
            return res.status(200).send({ status: 200, message: 'Notification sent successfully.' });
        } else {
            // Handle case when FCM token is not found
            console.log('No FCM token found');
            return res.status(400).send({ status: 400, message: 'FCM token not found for the user.' });
        }
    } catch (error) {
        // Handle any errors during notification sending
        console.error('Error sending notification:', error);
        return res.status(500).send({ status: 500, message: 'Failed to send notification.' });
    }
}

async function saveNotificationTokenController(req, res) {
    const fcmtoken = req.body.fcmToken;
    const userid = req.body.userid; // Fixed typo here (`req.boyd` to `req.body`)
    const platform = req.body.platform;

    try {
        const response = await saveUserNotificationToken(fcmtoken, userid, platform); // Assuming this is the correct order of arguments

        if (response.success) { // If user was successfully found and token saved
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
    saveNotificationTokenController,
    testNotificationController
}