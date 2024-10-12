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
    const { code } = req.body;

    const url = 'https://oauth2.googleapis.com/token';
    const data = {
        code,
        client_id: '460348077182-hfarubd5kv9mhq03e4g1ugfcjeopeo4m.apps.googleusercontent.com',
        client_secret: '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',
        redirect_uri: 'postmessage',
        grant_type: 'authorization_code'
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data), // Convert the data to JSON string format
            headers: { 'Content-Type': 'application/json' } // WORKS WITHOUT THIS
        });


        if (!response.ok) {
            const errorResult = await response.json(); // Parse error response
            throw new Error(errorResult.error_description || 'Failed to exchange authorization code');
        }

        const result = await response.json(); // Convert the response to JSON
        const accessToken = result.access_token;

        const userResponse = await fetch(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        const userDetails = await userResponse.json();
        let user = await processUser(userDetails); // Process user info (save or retrieve from DB)

        if (user) {
            const token = generateJWT(user);
            // Send token and user info to the frontend
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
        console.error('Error saving code:', error);
        res.status(500).json({ message: 'Failed to save code' });
    }
}

async function nativeGoogleAuth(req, res) {
    const { idToken } = req.body;
    console.log(idToken)

    try {
        const { tokens } = await client.getToken({
            idToken,
            client_id: '460348077182-hfarubd5kv9mhq03e4g1ugfcjeopeo4m.apps.googleusercontent.com',
            client_secret: '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',
            redirect_uri: 'postmessage',
        });

        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: '460348077182-hfarubd5kv9mhq03e4g1ugfcjeopeo4m.apps.googleusercontent.com',
        });

        const payload = ticket.getPayload();
        const user = await processUser(payload); // Save/retrieve user

        const token = generateJWT(user);
        res.status(200).json({ user, token });
        console.log(user)
    } catch (error) {
        console.error('Web Auth Error: ', error);
        res.status(500).json({ message: 'Web authentication failed' });
    }
}

module.exports = {
    googleAuth,
    nativeGoogleAuth,
}