const STENCIL_API_KEY = process.env.STENCIL_API_KEY

async function generateDaiyRecapImage(drEvent) {
    try {
        const raw = JSON.stringify({
            "template": "91c3c1f7-bd84-4ee8-ae15-9f2cf336da60",
            "modifications": [
                {
                    "name": "layer_background"
                },
                {
                    "name": "cover_image",
                    "src": `${drEvent.imageUrl}`
                },
                {
                    "name": "gradient"
                },
                {
                    "name": "event_title",
                    "text": `${drEvent.title}`
                },
                {
                    "name": "event_summary",
                    "text": `${drEvent.summary}`
                },
                {
                    "name": "genre",
                    "text": `${drEvent.genre}`
                },
                {
                    "name": "sources_count",
                    "text": `${drEvent.articleCount} Articles`
                },
                {
                    "name": "time_saved",
                    "text": `${drEvent.minutesSaved} Minutes Saved`
                }
            ]
        });

        const response = await fetch('https://api.usestencil.com/v1/images/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', "Authorization": `Bearer ${STENCIL_API_KEY}` },
            body: raw
        })

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Internal server error. Failed to fetch image`);
        } else {
            return data.image_url_jpg;
        }
    } catch (error) {
        console.error('Failed to generate image', error)
        return null;
    }
}

async function generateArticleInstagramPostImage(article) {
    // Determine authors string based on the number of authors
    const articleAuthors = article.author.length === 0
        ? undefined
        : article.author.length === 1
            ? article.author[0]
            : article.author.join(', ');

    try {
        const raw = JSON.stringify({
            "template": "551a319b-7ada-4f41-bd82-1a1371b95721",
            "modifications": [
                {
                    "name": "image",
                    "src": article.imageUrl
                },
                {
                    "name": "gradient"
                },
                {
                    "name": "source_time",
                    "text": `${article.source}${articleAuthors ? ", By: " + articleAuthors : ""}`
                },
                {
                    "name": "title",
                    "text": article.title
                },
                {
                    "name": "genre1",
                    "text": article.genre[0] || 'World'
                }
            ]
        });

        const response = await fetch('https://api.usestencil.com/v1/images/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${STENCIL_API_KEY}`
            },
            body: raw
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Internal server error. Failed to fetch image`);
        } else {
            return data.image_url_jpg;
        }
    } catch (error) {
        console.error('Failed to generate Instagram image post', error);
        return null;
    }
}

module.exports = {
    generateDaiyRecapImage,
    generateArticleInstagramPostImage
}