// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
// Replace 10.13.2 with latest version of the Firebase JS SDK.
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

importScripts('/service-worker.js'); // Ensure this matches your custom SW path

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    apiKey: 'api-key',
    authDomain: 'project-id.firebaseapp.com',
    databaseURL: 'https://project-id.firebaseio.com',
    projectId: 'project-id',
    storageBucket: 'project-id.appspot.com',
    messagingSenderId: 'sender-id',
    appId: 'app-id',
    measurementId: 'G-measurement-id',
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// import { config } from '../src/constants';
// Import the functions you need from the SDKs you need

// const FRONTEND_URL = config.url.FRONTEND_URL
// const BACKEND_URL = config.url.BACKEND_URL

messaging.onBackgroundMessage((payload) => {
    console.log('Background message received', payload)
    // Customize notification here
    // const notificationTitle = payload.notification?.title || "New Notification";
    const notificationTitle = payload.data?.title;
    // const notificationOptions = {
    //     body: payload.notification?.body + `${payload.notification?.url}` || "You have a new message.",
    //     icon: '/sumnews.net_black.png', // Optional: icon from FCM message
    //     tag: payload.notification?.tag, // The tag property is used to group or replace notifications with the same tag
    //     requireInteraction: false,
    //     data: {
    //         url: `${payload.notification?.url}`,
    //     },
    //     // actions: [
    //     //     { action: 'open_url', title: "Open" }
    //     // ],
    //     vibrate: [100, 50, 100],
    //     badge: '/logo_monochrome.png',
    //     timestamp: Date.now(),
    //     silent: false,
    // };
    const notificationOptions = {
        body: payload.data?.body || "You have a new message.",
        icon: '/sumnews.net_black.png', // Optional: icon from FCM message
        data: {
            url: `${payload.data.url}`,
        }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Add click event listener to handle URL opening
self.addEventListener('notificationclick', (event) => {
    const url = event.notification.data.url; // Extract the URL from the notification data
    console.log(url);
    event.notification.close(); // Close the notification

    // Open the URL in the browser
    event.waitUntil(
        clients.openWindow(url)
    );

    const action = event.action;

    if (action === 'open_url') {
        const url = event.notification.data.url; // Extract the URL from the notification data
        event.notification.close(); // Close the notification

        // Open the URL in the browser
        event.waitUntil(
            clients.openWindow(url)
        );
    }
});


// ----- EXAMPLE -----
// https://medium.com/@theDeepakYadav/web-push-notification-with-firebase-cloud-messaging-313536815628
// To dispaly background notifications
/* if (messaging) {
    try {
      messaging.onBackgroundMessage((payload) => {
      console.log('Received background message: ', payload);
      const notificationTitle = payload.notification.title;
      const notificationOptions = { 
        body: payload.notification.body,
        tag: notificationTitle, // tag is added to ovverride the notification with latest update
        icon: payload.notification?.image || data.image,
        data: {
          url: payload?.data?.openUrl,// This should contain the URL you want to open
        },
      }
      // Optional
        //   This condition is added because notification triggers from firebase messaging console doesn't handle image by default.
        //   collapseKey comes only when the notification is triggered from firebase messaging console and not from hitting fcm google api.
          
          if (payload?.collapseKey && notification?.image) {
            self.registration.showNotification(notificationTitle, notificationOptions);
          } else {
             // Skipping the event handling for notification
             return new Promise(function(resolve, reject) {});
          }
      });
    } catch (err) {
      console.log(err);
    }
  }
*/