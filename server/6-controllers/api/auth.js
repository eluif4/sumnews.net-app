async function googleAuth(req, res) {
    const { code } = req.body;
    console.log('Authorization Code:', code);

    const url = 'https://oauth2.googleapis.com/token';
    const data = {
        code,
        client_id: '460348077182-hfarubd5kv9mhq03e4g1ugfcjeopeo4m.apps.googleusercontent.com',
        client_secret: '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',
        redirect_uri: 'http://localhost:5173/',
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
        console.log('Token Response:', result);
        
        const accessToken = result.data.access_token;
        const idToken = result.id_token;
        console.log('Access Token:', accessToken);
        console.log('Id Token:', idToken)

    } catch (error) {
        console.error('Error:', error);
    }
}

module.exports = {
    googleAuth
}