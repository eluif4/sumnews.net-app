const { admin } = require('../firebase/firebase');

const sendNotification = async (deviceToken, payload) => {
    try {
        // Get todays Daily Recap url
        // Message payload
        const message = {
            /* 
            Notification object sends a default FCM notification
            I placed all the information in the data propertyto be able to customize my notifications
            */
            // notification: {
            //     title: payload.title + "1",   // Notification title
            //     body: payload.body,     // Notification body
            //     // tag: payload.tag,       // Notification tag. Versioning is used with vX
            // },
            data: {
                title: payload.title,
                body: payload.body,
                url: payload.url        // Use data field to pass the URL
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