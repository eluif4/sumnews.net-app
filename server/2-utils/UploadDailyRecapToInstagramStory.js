const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const { IgApiClient } = require('instagram-private-api');

const IG_USERNAME = process.env.IG_USERNAME;
const IG_PASSWORD = process.env.IG_PASSWORD;

const imagepath = './story_output.png';

// registerFont('./server/fonts/Bitter-Regular.ttf', { family: 'Bitter' });
// ----- CANVAS CREATION -----
// Define canvas dimensions
const width = 1080;
const height = 1920;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Colors and fonts
const font = 'Bitter'
const backgroundColor = '#404040';
const genreBgColor = '#62FEBD';
const textColor = '#FFFFFF';
const footerColor = '#0d1015';
const genreTextColor = '#000000';
const titleFont = `48px ${font}`;  // Increased by 4px
const dateFont = `30px ${font}`;   // Increased by 4px
const contentFont = `40px ${font}`; // Increased by 4px
const footerFont = `32px ${font}`; // Increased by 4px
const genreFont = `30px ${font}`;  // Increased by 4px

// Function to draw rounded rectangle
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}

// Draw a rectangle with rounded bottom corners only
function drawRoundedBottomRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x, y); // Move to top-left corner
    ctx.lineTo(x + width, y); // Line to top-right corner
    ctx.lineTo(x + width, y + height - radius); // Line to bottom-right corner start
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius); // Bottom-right rounded corner
    ctx.lineTo(x + radius, y + height); // Line to bottom-left corner start
    ctx.arcTo(x, y + height, x, y + height - radius, radius); // Bottom-left rounded corner
    ctx.lineTo(x, y + radius); // Line to top-left corner start
    ctx.arcTo(x, y, x + radius, y, radius); // Top-left corner (square)
    ctx.closePath();
}

// Load the image and get its dimensions
async function loadImageDimensions(imageUrl) {
    const image = await loadImage(imageUrl);
    return { imageWidth: image.width, imageHeight: image.height };
}

// Function to convert ISO date string to a human-readable format
function formatDate(isoDateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(isoDateString);
    return date.toLocaleDateString('en-US', options);
}

async function createDailyRecapImage(genres, title, date, summarizedContent, imageUrl, nSources) {
    try {
        // Trim HTML tags from the summarizedContent before uploading to story
        var cleanedSummarizedContent = summarizedContent.replace(/<\/?[^>]+(>|$)/g, '').trim();
        // Load the image
        const image = await loadImage(imageUrl);
        const { imageWidth, imageHeight } = await loadImageDimensions(imageUrl);
        // Background
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // Image placement with rounded corners and box shadow
        const ratio = 1080 / imageWidth;
        var imgHeight = imageHeight * ratio; // Adjusted to free ratio
        imgHeight = imgHeight > 1080 ? 1080 : imgHeight; // Ensure height doesn't exceed 1080
        const borderRadius = 25;

        // Create a separate canvas for the image with shadow
        const shadowPadding = 40;
        const imageCanvas = createCanvas(width + shadowPadding * 2, imgHeight + shadowPadding * 2);
        const imageCtx = imageCanvas.getContext('2d');

        // Darker shadow
        imageCtx.shadowColor = 'rgba(0, 0, 0, 0.5)'; // Darker shadow
        imageCtx.shadowBlur = 40;
        imageCtx.shadowOffsetY = 10;

        // Draw the background rectangle with shadow
        imageCtx.save();
        drawRoundedBottomRect(imageCtx, shadowPadding, shadowPadding, width, imgHeight, borderRadius);
        imageCtx.fillStyle = '#FFFFFF';
        imageCtx.fill();
        imageCtx.restore();

        // Clip to the rounded rectangle and draw the image
        imageCtx.save();
        imageCtx.beginPath();
        // Start path at top-left
        imageCtx.moveTo(shadowPadding, shadowPadding);
        // Top edge
        imageCtx.lineTo(shadowPadding + width, shadowPadding);
        // Right edge
        imageCtx.lineTo(shadowPadding + width, shadowPadding + imgHeight - borderRadius);
        // Bottom-right rounded corner
        imageCtx.arcTo(shadowPadding + width, shadowPadding + imgHeight, shadowPadding + width - borderRadius, shadowPadding + imgHeight, borderRadius);
        // Bottom edge
        imageCtx.lineTo(shadowPadding + borderRadius, shadowPadding + imgHeight);
        // Bottom-left rounded corner
        imageCtx.arcTo(shadowPadding, shadowPadding + imgHeight, shadowPadding, shadowPadding + imgHeight - borderRadius, borderRadius);
        // Back to the starting point
        imageCtx.lineTo(shadowPadding, shadowPadding);
        imageCtx.closePath();
        imageCtx.clip();
        imageCtx.drawImage(image, shadowPadding, shadowPadding, width, imgHeight);
        imageCtx.restore();

        // Draw the image canvas onto the main canvas
        ctx.drawImage(imageCanvas, -shadowPadding, -shadowPadding);

        // Bottom gradient (transparent to black)
        const gradient = ctx.createLinearGradient(0, height - 250, 0, height); // Changed from 300 to 200
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, footerColor);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - 250, width, 250); // Changed from 300 to 200

        // Genres (aligned horizontally with rounded backgrounds)
        ctx.font = genreFont;
        let genreX = 40;
        const genrePadding = { top: 10, right: 20, bottom: 10, left: 20 };
        const genreGap = 30;
        const genreBorderRadius = 4; // Changed to 4px

        genres.forEach((genre) => {
            const textWidth = ctx.measureText(genre).width;
            const genreBoxWidth = textWidth + genrePadding.left + genrePadding.right;
            const genreBoxHeight = parseInt(genreFont) + genrePadding.top + genrePadding.bottom;

            // Draw genre background
            ctx.fillStyle = genreBgColor;
            drawRoundedRect(ctx, genreX, imgHeight + 30, genreBoxWidth, genreBoxHeight, genreBorderRadius);
            ctx.fill();

            // Draw genre text
            ctx.fillStyle = genreTextColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(genre, genreX + genreBoxWidth / 2, imgHeight + 30 + genreBoxHeight / 2);

            genreX += genreBoxWidth + genreGap;
        });

        // Title (with text wrapping)
        ctx.fillStyle = textColor;
        ctx.font = titleFont;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const titleMaxWidth = width - 80;
        const titleLines = wrapText(ctx, title, titleMaxWidth);
        let titleY = imgHeight + 100;
        titleLines.forEach((line, index) => {
            ctx.fillText(line, 40, titleY + index * 48); // Adjusted line height
        });

        // Calculate the vertical offset based on the number of title lines
        const titleHeight = titleLines.length * 48; // Line height for title

        // Date (pushed down by the title height)
        const formattedDate = formatDate(date);

        ctx.fillStyle = textColor;
        ctx.font = dateFont;
        const dateY = titleY + titleHeight + 40;
        ctx.fillText(formattedDate, 40, dateY);

        // Summarized Content (pushed down accordingly)
        ctx.font = contentFont;
        const contentYStart = dateY + 70; // Push the content down below the date
        const contentMaxWidth = width - 80;
        const contentLines = wrapText(ctx, cleanedSummarizedContent, contentMaxWidth);
        contentLines.forEach((line, index) => {
            ctx.fillText(line, 40, contentYStart + index * 54); // Adjusted line height to 50px
        });

        // Footer (moved up by 30px)
        ctx.font = footerFont;
        ctx.fillStyle = genreBgColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        // const articleText = nSources === 1
        //     ? 'One article covers this event'
        //     : `${nSources} articles cover this event`;
        ctx.fillText(articleText, width / 2, height - 40); // Moved up by 30px

        // Save canvas to a file
        const buffer = canvas.toBuffer('image/jpeg');
        fs.writeFileSync(imagepath, buffer); // Changed extension to .png
    } catch (error) {
        console.error('Couldnt create image', error)
    }
}

// Helper function to wrap text into lines with a maximum of 15 lines
function wrapText(ctx, text, maxWidth, maxLines = 15) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;

        if (width < maxWidth) {
            currentLine += ' ' + word;
        } else {
            lines.push(currentLine);
            currentLine = word;

            // Check if the maximum number of lines has been reached
            if (lines.length >= maxLines) {
                lines.push('...'); // Add ellipsis to indicate truncation
                break;
            }
        }
    }

    // Push the last line if it doesn't exceed the maxLines limit
    if (lines.length < maxLines) {
        lines.push(currentLine);
    }

    return lines;
}

// Function to sleep for a random time between min and max seconds
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// Function to send email notification
// async function sendFailureEmail(subject, message) {
//     // Configure nodemailer (assuming Gmail, but you can use any email service)
//     let transporter = nodemailer.createTransport({
//         service: 'gmail',
//         auth: {
//             user: process.env.EMAIL_USER, // Your email
//             pass: process.env.EMAIL_PASS  // Your email password
//         }
//     });

//     // Send the email
//     let info = await transporter.sendMail({
//         from: `"Sumnews.net App" <${process.env.EMAIL_USER}>`,  // Sender address
//         to: `${process.env.EMAIL_USER}`,  // Your email address to receive the notification
//         subject: subject,
//         text: message
//     });

//     console.log('Error notification email sent:', info.response);
// }

// ----- INSTAGRAM STORY CREATION -----
async function postToInstaStory(articles) {
    console.log('Connecting to ' + IG_USERNAME + ' account...');
    const ig = new IgApiClient();
    ig.state.generateDevice(IG_USERNAME);
    await ig.account.login(IG_USERNAME, IG_PASSWORD);

    console.log('Connected...')

    try {
        for (const article of articles) {
            // Sleep for a random time between 10 to 30 seconds
            const randomDelay = Math.floor(Math.random() * (30000 - 10000 + 1)) + 10000;
            console.log(`Waiting for ${randomDelay / 1000} seconds before uploading the next story...`);
            await sleep(randomDelay);

            console.log('Creating image')
            console.log(article.title, article.imageUrl)
            await createDailyRecapImage(article.genre, article.title, article.datePublished, article.summarizedContent, article.imageUrl, articles.length);
            const imageBuffer = fs.readFileSync(imagepath);
            try {
                console.log('Uploading to Instagram')
                const result = await ig.publish.story({
                    file: imageBuffer
                });

                console.log('Deleting image')
                fs.unlinkSync(imagepath);
            } catch (error) {
                // Handle IgCheckpointError specifically
                if (error.name === 'IgCheckpointError') {
                    console.error('Instagram checkpoint challenge detected:', error);
                    try {
                        // Try to solve it automatically
                        await ig.challenge.auto(true);
                        console.log('Challenge solved automatically.');
                    } catch (challengeError) {
                        console.error('Failed to solve Instagram challenge:', challengeError);
                        // Send email if the challenge cannot be resolved
                        // await sendFailureEmail('Failed to solve Instagram challenge', challengeError.message);
                    }
                } else {
                    console.error('Error posting story to Instagram:', error);
                    // await sendFailureEmail('Failed to upload Instagram story', challengeError.message);
                }
            }
        }
    } catch (error) {
        console.error('Failed to upload image to instagram story', error)
    }
};

module.exports = {
    postToInstaStory
}