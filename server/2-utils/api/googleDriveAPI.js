const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const SERVICE_ACCOUNT_FILE = path.join(__dirname, '../../../credentials.json');

// Authenticate with Google Drive API
const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_FILE,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

// Function to upload an image file
async function uploadImage(filePath, fileName) {
    const fileMetadata = {
        name: fileName,
    };

    const media = {
        mimeType: 'image/jpeg', // Change based on your image type
        body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
    });

    console.log('File ID:', response.data.id);
    return response.data.id; // Return the file ID for future use
}

// Function to make file with fileId public
async function makeFilePublic(fileId) {
    try {
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
                // emailAddress: 'eluif4@gmail.com'
            },
        });
        // Return the public URL
        return `https://drive.google.com/uc?id=${fileId}`;
    } catch (error) {
        console.error('Failed to make file public', error);
        return ''
    }
}

async function uploadImageForPost(filePath, fileName) {
    try {
        // Example usage
        const fileId = await uploadImage(filePath, fileName);
        const imageUrl = await makeFilePublic(fileId);

        return imageUrl
    } catch (error) {
        console.error('Failed to upload file to google drive', error);
        return undefined
    }
}

module.exports = {
    uploadImageForPost
}