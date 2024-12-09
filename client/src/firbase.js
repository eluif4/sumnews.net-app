// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken } from "firebase/messaging";

console.log('firebase.js')
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const firebaseMessaging = getMessaging(firebaseApp);

getToken(firebaseMessaging, { vapidKey: "BL-h_T1I7I9_Vy9gJOnGqCJYdVVaMrMokFpb2azwfhPzjUok8_2u43j7qXt3J5zZbmTcdOF3wTnTqsgXqG0EISs" })
    .then((regToken) => {
        if (regToken) {
            console.log(regToken);
            fetch(`${BACKEND_URL}firebase/registerToken`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ regToken })
            })
        } else {
            console.log('No registration token available. Request permission to generate one.');
        }
    })

export { firebaseApp, firebaseAnalytics, firebaseMessaging }