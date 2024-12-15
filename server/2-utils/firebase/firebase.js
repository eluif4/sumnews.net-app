const admin = require('firebase-admin');

// Import your service account key JSON file
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

console.log("Firebase Admin Initialized");

module.exports = { admin }