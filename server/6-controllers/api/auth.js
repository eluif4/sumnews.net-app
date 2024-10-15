const path = require("path")
const DBUTILS = path.join(__dirname, '../../2-utils/db')
const DatabaseAccess = path.join(DBUTILS, "/databaseAccess.js")
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client('460348077182-hfarubd5kv9mhq03e4g1ugfcjeopeo4m.apps.googleusercontent.com');
const { processUser } = require(DatabaseAccess)

const jwt = require('jsonwebtoken');
const process = require('process');

function generateJWT(user) {
    // does my payload need to be bigger to accomodate all the other user information
    const payload = {
        userId: user._id,
        googleId: user.googleId,
        email: user.email
    };

    // Sign the JWT token with a secret key and set expiration to 1 year (365 days)
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '365d' });
}

async function googleAuth(req, res) {
    const { idToken } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: '460348077182-hfarubd5kv9mhq03e4g1ugfcjeopeo4m.apps.googleusercontent.com'
        });

        const payload = ticket.getPayload();
        let user = await processUser(payload); // Process user info (save or retrieve from DB)

        if (user) {
            // Generate JWT
            const token = generateJWT(user);

            // Send the token and user info to the frontend
            res.status(200).json({
                message: 'Authentication successful',
                user: user,
                token: token // Send the JWT to the frontend
            });
        }
        else {
            res.status(500).json({ message: 'Athentication failed', user: null });
        }

    } catch (error) {
        console.error('Error verifying ID token:', error);
        res.status(500).json({ message: 'Failed to authenticate user' });
    }
}

module.exports = {
    googleAuth,
}