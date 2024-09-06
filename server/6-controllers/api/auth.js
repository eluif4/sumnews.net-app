const path = require("path")
const DBUTILS = path.join(__dirname, '../../2-utils/db')
const DatabaseAccess = path.join(DBUTILS, "/databaseAccess.js")
const { processUser } = require(DatabaseAccess)

async function googleAuth(req, res) {
    const { code } = req.body;
    console.log('Authorization Code:', code);

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

        // process user information and perform necessary actions
        let user = await processUser(userDetails);

        if (user)
            res.status(200).json({ message: 'Authentication successful', user: user })
        else
            res.status(500).json({ message: 'Athentication failed', user: null });
    } catch (error) {
        console.error('Error saving code:', error);
        res.status(500).json({ message: 'Failed to save code' });
    }
}

module.exports = {
    googleAuth
}