// const { uploadImageForPost } = require("../../2-utils/api/googleDriveAPI");

// async function uploadImageToGoogleDriveController(req, res) {
//     try {
//         const { filePath, fileName } = req.body;
//         const response = await uploadImageForPost(filePath, fileName)
//         if (response.success) {
//             res.send('Successfully uploaded image to google drive')
//         } else {
//             res.send('Failed to upload image to google drive')
//         }
//     } catch (error) {
//         console.error('Failed to upload image')
//     }
// }

// module.exports = {
//     uploadImageToGoogleDriveController
// }