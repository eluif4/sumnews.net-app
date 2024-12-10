const sendNotification = async (deviceToken, title, body) => {
    try {
        // Message payload
        const message = {
            notification: {
                title: title, // Notification title
                body: body,   // Notification body
            },
            token: deviceToken, // The FCM token of the target device
        };

        // Send message via Firebase Admin SDK
        const response = await admin.messaging().send(message);
        console.log("Notification sent successfully:", response);
    } catch (error) {
        console.error("Error sending notification:", error);
    }
};

module.exports = { sendNotification };


// Example usage
// const deviceToken = "DEVICE_TOKEN_HERE"; // Replace with actual device token
// sendNotification(deviceToken, "Daily Recap Ready!", "Catch up on today's top stories now!");  