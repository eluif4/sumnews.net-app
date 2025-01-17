// Import the functions you need from the SDKs you need
import { getMessaging, onMessage, getToken } from "firebase/messaging";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { config } from './constants'
// Import the functions you need from the SDKs you need

const FRONTEND_URL = config.url.FRONTEND_URL
const BACKEND_URL = config.url.BACKEND_URL

const firebaseConfig = {
    apiKey: "AIzaSyBdFFmrZL2C7jlrh0kfDNJMirzCWbJ5VQ4",
    authDomain: "sumnews-62a1c.firebaseapp.com",
    projectId: "sumnews-62a1c",
    storageBucket: "sumnews-62a1c.firebasestorage.app",
    messagingSenderId: "460887858930",
    appId: "1:460887858930:web:31ad28d743612d0ad5fa6b",
    measurementId: "G-8P8TRS3XWH"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const firebaseAnalytics = getAnalytics(firebaseApp);

// Initialize Firebase Cloud Messaging and get a reference to the service
const firebaseMessaging = getMessaging(firebaseApp);

// Handle incoming messages. Called when:
// - a message is received while the app has focus
// - the user clicks on an app notification created by a service worker
//   `messaging.onBackgroundMessage` handler.

// Listen for foreground messages
onMessage(firebaseMessaging, (payload) => {
    console.log("Message received. ", payload);

    // Extract notification details from payload
    // const notificationTitle = payload.notification?.title || "New Notification";
    const notificationTitle = payload.data?.title;
    const notificationOptions = {
        body: payload.data?.body || "You have a new message.",
        icon: '/sumnews.net_black.png', // Optional: icon from FCM message
        url: `${FRONTEND_URL}${payload.data.url}`,
    };

    // Display the notification using the Web Notifications API
    if (Notification.permission === "granted") {
        const notification = new Notification(notificationTitle, notificationOptions);

        // Add a click event listener to handle notification clicks
        notification.addEventListener('click', (event) => {
            console.log('Notification clicked, opening URL:', notificationOptions.url);
            window.open(notificationOptions.url, '_self');  // Open the URL in a new tab
        });
    } else {
        console.warn("Notifications are not allowed by the user.");
    }
});

async function getAndSaveUsersFCMToken(userid, platform) {
    try {
        const regToken = await getToken(firebaseMessaging, { vapidKey: "BL-h_T1I7I9_Vy9gJOnGqCJYdVVaMrMokFpb2azwfhPzjUok8_2u43j7qXt3J5zZbmTcdOF3wTnTqsgXqG0EISs" });

        if (regToken && userid) {
            try {
                const response = await fetch(`${BACKEND_URL}db/saveNotificationToken`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ fcmToken: regToken, userid: userid, platform: platform })
                });

                if (response.ok) {
                    return { success: true, message: "Token successfully sent to the backend." };
                } else {
                    return {
                        success: false,
                        message: "Failed to send token to backend.",
                        responseStatus: response.status,
                        responseStatusText: response.statusText
                    };
                }
            } catch (error) {
                console.error("Error sending token to backend:", error);
                return { success: false, message: "Error sending token to backend." };
            }
        } else {
            return { success: false, message: "No registration token available. Request permission to generate one." };
        }
    } catch (error) {
        console.error("Error getting registration token:", error);
        return { success: false, message: "Error getting registration token." };
    }
}

export { getAndSaveUsersFCMToken }