const { admin } = require('../firebase/firebase');

const sendNotification = async (deviceToken, payload) => {
    try {
        const message = {
            notification: {
                title: payload.title || "Default Title",  // Notification title
                body: payload.body || "Default Body",    // Notification body
            },
            data: {
                url: payload.url,  // The URL to open when the notification is clicked
            },
            android: {
                priority: 'high',
                notification: {
                    sound: 'default', // Ensure sound works for Android
                    icon: 'ic_stat_name',
                    color: "#000000",
                    tag: 'DAILY_RECAP', // Tag for grouping notifications
                }
            },
            apns: {
                payload: {
                    aps: {
                        category: 'DAILY_RECAP', // Optional: Customize for iOS
                    },
                },
            },
            token: deviceToken,  // The FCM token of the target device
        };

        // Send message via Firebase Admin SDK
        const response = await admin.messaging().send(message);
        return { success: true, message: response };
    } catch (error) {
        console.error("Error sending message", error);
        return { success: false, message: error };
    }
};

module.exports = { sendNotification };