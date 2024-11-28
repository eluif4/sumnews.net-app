const { generateArticleInstagramPostImage } = require('../api/stencil-image-template-api')

const INSTAGRAM_PAGE_ID = process.env.INSTAGRAM_ACCOUNT_ID
var LONG_LIVED_ACCESS_TOKEN = process.env.LONG_LIVED_ACCESS_TOKEN

// Upload the content to Instagram and publish it as a story
async function uploadStoryToInstagram(imageUrl) {
    try {
        if (imageUrl == undefined) {
            console.log('No image url received')
        } else {
            // Step 2: Upload the content to Instagram Media Container
            const mediaContainerResponse = await fetch(
                `https://graph.facebook.com/v21.0/${INSTAGRAM_PAGE_ID}/media`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_url: imageUrl,
                        media_type: "STORIES",
                        access_token: LONG_LIVED_ACCESS_TOKEN,
                    }),
                }
            );

            const mediaContainerData = await mediaContainerResponse.json();
            if (!mediaContainerData.id) {
                throw new Error(`Failed to create media container: ${JSON.stringify(mediaContainerData)}`);
            }

            // Step 3: Publish the story on Instagram
            const publishResponse = await fetch(
                `https://graph.facebook.com/v21.0/${INSTAGRAM_PAGE_ID}/media_publish`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        creation_id: mediaContainerData.id,
                        access_token: LONG_LIVED_ACCESS_TOKEN,
                    }),
                }
            );

            const publishData = await publishResponse.json();
            if (!publishData.id) {
                throw new Error(`Failed to publish story: ${JSON.stringify(publishData)}`);
            }

            console.log('Story successfully uploaded and published on Instagram');
            return { success: true, id: publishData.id };
        }
    } catch (error) {
        console.error('Failed to upload story to Instagram:', error);
        return { success: false };
    }
}

async function postArticle(article, imageUrl) {
    try {
        if (!article) {
            console.log('No article provided');
        }
        else {
            var caption = article.summarizedContent;
            caption += `\n\nDelve into more summarized article like this one on our app! Link in our bio.`
            const mediaContainerResponse = await fetch(
                `https://graph.facebook.com/v21.0/${INSTAGRAM_PAGE_ID}/media`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_url: imageUrl,
                        caption: caption,
                        access_token: LONG_LIVED_ACCESS_TOKEN,
                    }),
                }
            );

            const mediaContainerData = await mediaContainerResponse.json();
            if (!mediaContainerData.id) {
                throw new Error(`Failed to create media container: ${JSON.stringify(mediaContainerData)}`);
            }

            // Step 3: Publish the story on Instagram
            const publishResponse = await fetch(
                `https://graph.facebook.com/v21.0/${INSTAGRAM_PAGE_ID}/media_publish`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        creation_id: mediaContainerData.id,
                        access_token: LONG_LIVED_ACCESS_TOKEN,
                    }),
                }
            );

            const publishData = await publishResponse.json();
            if (!publishData.id) {
                throw new Error(`Failed to publish post: ${JSON.stringify(publishData)}`);
            }

            console.log('Post successfully uploaded and published on Instagram');
            return { success: true, id: publishData.id };
        }
    } catch (error) {
        console.error('Failed to post article to Instagram', error);
        return { success: false };
    }
}

async function postArticleToInstagram(article) {
    try {
        const stencilImage = await generateArticleInstagramPostImage(article);

        if (stencilImage) {
            const instagramResponse = await postArticle(article, stencilImage);
            if (instagramResponse.success) {
                console.log(`Post ${instagramResponse.id} successfully uploaded`);
                return instagramResponse.id
            } else {
                console.log('Response isnt OK');
                return null;
            }
        }
    } catch (error) {
        console.error('Something went wrong when creating instagram post', error);
        return null;
    }
}

module.exports = {
    uploadStoryToInstagram,
    postArticle,
    postArticleToInstagram
}