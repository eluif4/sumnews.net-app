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


/*
const dailyRecap = {
    dateCreated: ISODate,
    source: string ( 'the source of the daily recap' )
    drEvent: Object ( 'housing all the properties of a singular event in a daily recap)
}

const drEvent = {
imageUrl: string ( 'image from an article in the event' ),
    title: string ( 'the title that best portrays the event' ),
    summary: string ( 'the summarized part of all articles in the event' )
    articleCount: int ( 'amount of sources that wrote on the event' )
    genre: string ( 'the most relevant genre of the event' )
    minutesSaved: Int ( 'number of minutes saved from reading the summary instead of reading different articles: average of all minutes saved from articles in event)
}
*/

module.exports = {
    generateDaiyRecapImage
}