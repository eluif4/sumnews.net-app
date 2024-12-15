const { admin } = require('../firebase/firebase')

const sendNotification = async (deviceToken, title, body) => {
    try {
        // Message payload
        const message = {
            notification: {
                title: title, // Notification title
                body: body,   // Notification body
            },
            android: {
                notification: {
                    icon: 'ic_notification', // Icon name without Extension
                    color: "#000000" // Optional: Notification Color Icon
                }
            },
            token: deviceToken, // The FCM token of the target device
        };

        // Send message via Firebase Admin SDK
        const response = await admin.messaging().send(message);
        return { success: true, message: response }
    } catch (error) {
        console.error(error);
        return { success: false, message: error };
    }
};

module.exports = { sendNotification };