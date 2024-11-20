const cache = require('memory-cache')
const { getAllGenres } = require('../db/getCollections')

const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

const MODEL_NAME = "gemini-1.5-flash";
const apiKey = process.env.GEMINI_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// const SYSTEM_INSTRUCTIONS = `You are an article summarizer expert tasked with summarizing articles and assigning 
// the most relevant genres to them. Refer to the detailed instructions below when providing an output.`;

// const DATA_FORMAT = `**Data Format and Examples:**

// **Input:**
// An array of articles represented as JSON objects. Each article object has the following properties:
// title (string): The title of the article.
// url (string): The URL of the article.
// content (string): The full content of the article.

// **Output:**
// An array of articles in the same order as the input array, with the following properties:
// title (string): Title of the article (unchanged).
// url (string): URL of the article (unchanged).
// summary (string): A concise summary of the article (output of JOB1).
// genres (array): An array of relevant genre tags (output of JOB2).

// Example:
// Input:
// [
//   {
//     "title": "Sample Article 1",
//     "url": "https://example.com/article1",
//     "content": "This is the content of the first article."
//   },
//   {
//     "title": "Sample Article 2",
//     "url": "https://example.com/article2",
//     "content": "This is the content of the second article."
//   }
// ]

// Output:
// [
//   {
//     "title": "Sample Article 1",
//     "url": "https://example.com/article1",
//     "summary": "A concise summary of the first article.",
//     "genres": ["Genre1", "Genre2"]
//   },
//   {
//     "title": "Sample Article 2",
//     "url": "https://example.com/article2",
//     "summary": "A concise summary of the second article.",
//     "genres": ["Genre1", "Genre2", "Genre3"]
//   }
// ]`;

// const TASK = `**TASK:**
// For every article: Complete both JOB1 (summarization) and JOB2 (genre assignment).`;

// const SUMMARIZING_TASK = `**JOB1: Summarize Articles**
// Task:
// 1. Summarize the orignal article's contents into a concise, informative, and engaging summary for each article in the input array. 
// 2. Follow the specific guidelines and requirements listed below.

// **Guidelines:**
// 1. Conciseness: Ouput summaries should be up to 100 words in length.
// 2. Relevance: Focus on the article's main points, 
// 3. Clarity: Use a conversational tone and avoid jargon. The article should be easily read and understood by a myriads of people from all walks of life. Write the summary as if you were the journalist of the article. The output is more of a short article than a summary of the original.
// 4. Structure: Follow a clear opening, body, and conclusion format. Do not repeat information in the summary that is already found in the title of the article. The opening should answer the title or provide the most relevant information the user is looking for when reading the title of the article.
// 5. Incorporate the features listed below where appropriate to enhance reading experience and understanding.
// 6. Safety: Avoid potentially unsafe content and use appropriate language.

// **Features**
// 1. Quotes: Include key quotes from the article that provide significant insights or support the main points of the summary. These quotes should complement your summary by offering direct, unaltered statements from the original content.

// Fallback: If you are unable to return an acceptable summary, return undefined.

// Quotes Guidelines: 
// Accuracy:  DO NOT modify the quotes in any way. They should be presented exactly as they appear in the article.
// Length: Keep quotes short, focusing on capturing the essence of an important idea or viewpoint from the article. Quotes should be counted as part of the summaries' 100 word limit.
// Placement: Quotes aren't mandatory in each article. When you do use quotes in a summary make sure to distribute them throughout the summary where they naturally fit, enhancing the narrative and providing a stronger connection to the original content.
// Frequency: You can include multiple quotes in your summary if they help to clarify or emphasize the key points
// Format: Enclose all quotes in <quote> tags.
// Examples on how to use quotes in a summary: 
//     Article content here, <quote>"Quote from original article here"</quote>, more summary content here

// 2. Lists: Create structured lists in the summary whenever the article discusses, mentions, or compares multiple items (e.g., movies, shopping items, music, budget options, etc.). The purpose of lists is to enhance clarity and organization by breaking down complex information into easily digestible parts. Use lists to present key points, comparisons, or enumerations clearly and effectively.

// Lists Guidelines:
// Detection: Look for enumerations, comparisons, or lists of items within the content or title of the article.
// Integration: Lists can be used in conjunction with other features and free text within the summary, seamlessly integrating into the overall narrative.
// Integration: Lists can be used in conjunction with other features and free text within the summary, seamlessly integrating into the overall narrative.
// Format: Create lists in your summaries using HTML <ol> or <ul> tags. Ensure the list has a class attribute set to "list."  Each part of the list should be placed within a <li> tag. Ensure each list item conveys a clear and specific point.
// Example: <ol class="list">
//     <li>First list item content here</li>
//     <li>Second list item content here</li>
//     <li>Third list item content here</li>
//     ...
// </ol>

// 3. Paragraph Formatting: Add spacing between paragraphs to improve readability when the summary is more than one paragraph.

// Paragraphs Guidelines:
// Detection: Insert paragraph breaks to break up the text and reduce eye strain, making the summary easier to read.
// Placement: Paragraph breaks should appear naturally where there is a shift in subject matter, making the summary easier to follow.
// Format: Use two <br> HTML tags to create the necessary space between paragraphs.
// Example of usage in a summary: "Content of paragraph one goes here. <br><br> Content of paragraph two goes here."

// **Rules**
// Never produce information that isn't provided, found or mentioned in an articles content.
// Adhere to the word limit and avoid irrelevant information.
// Write summaries as if you were the journalist.
// Avoid promotional or subscription-related content.
// Use quotes correctly and avoid excessive quoting.`;

// const ASSIGN_GENRE_TASK = `**JOB2: Classify Articles by Genre**
// Task:
// Assign the most relevant genre(s) to each article based on its title, content, and a provided genre list.

// **Guidelines:**
// Relevance: Prioritize genres that closely match the article's content or theme.
// Format: Return genres as an array, with the most relevant genres listed first.

// **Rules:**
// Always return at least one genre.
// Only user genres from the provided list.

// Fallback: If unable to determine a relevant genre, return "World"`

// let GENRE_LIST;

// (async function initializeGenres() {
//     try {
//         const cachedGenres = cache.get('genres');
//         const allGenres = cachedGenres ? cachedGenres : await getAllGenres();
//         const genres = allGenres.map(genreObj => genreObj.genre);
//         GENRE_LIST = `GENRE LIST: [${genres}]`;
//     } catch (error) {
//         console.error('Error fetching genres:', error);
//     }
// })();


// const SYSTEM_INSTRUCTIONS = `You are an expert at summarization and genre classification.\nYour task is to process an array of articles provided in JSON format, where each article contains the following properties:\n- string title\n- string url\n- string content\n\nFor each article, perform the following tasks:\n\n1. Summarize the article content in under 140 tokens. Make sure the summary is concise, capturing the key points of the article in a journalistic style.\n\n2. Assign the most relevant genre(s) to each article from the predefined genre list based on the title and content. Prioritize the most relevant genres, and ensure at least one genre is assigned from the list. Return the genres as an array with the most relevant genre first.\n\nThe output should be an array in JSON format where each article contains the following properties:\n- string title\n- string url\n- string summary (generated from the content)\n- array genres (assigned from the genre list)\n\nIf you are unable to summarize the content, return the value \"undefined\" for the summary. If no relevant genre is found, default to \"World\".\n\nGENRE LIST: [Features,Opinion,How-to Guides,Reviews,Interviews,Listicles,Profiles,Tutorials,Research,Editorials,Analysis,Travel,Human Interest,Satire,Historical,Technology,Health and Wellness,Entertainment,Politics,Business & Finance,World,Environment,Science,Education,Sports,Lifestyle,Personal Finance,Science Fiction and Fantasy,Parenting & Family,Food and Cooking,History and Archaeology,Weather,Recreation,Art,Shopping,Home,Agriculture,Animals & Wildlife,Vacation,Fashion,Music,Film & TV,Gaming,Literature,Cultural,Social,Fitness & Exercise,DIY and Home Improvement,Mental Health,Automotive,Photography,Religion,Career & Work,Social Media,Crime]\n`

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
]

const articleSummarizerModel = genAI.getGenerativeModel({
    model: MODEL_NAME,
    safetySettings: safetySettings,
    systemInstruction: "For each article in the users input of articles do the following:\nAs a professional summarizer, create a concise and comprehensive summary of the provided text while adhering to these guidelines:\n\n1. Craft a summary that is detailed, thorough, and complex, while maintaining clarity and conciseness. Start you summary by answering the question on the title or the answer the readers seeks to find when reading the title.\n2. Each articles summary should be no more than 150 tokens. Summaries longer than the expected length are unacceptable.\n3. Incorporate main ideas and essential information, eliminating extraneous language and focusing on critical aspects.\n4. Rely strictly on the provided text, without including external information.\n5. Format the summary in a coherent, flowing paragraph for easy understanding. \n6. Make sure to create a full summary for each article. Make sure not to miss any article or cut any summary short. \n7. Safety: Avoid potentially unsafe content and use appropriate language.\n\nIt is paramount to output and return all the input articles provided in the same order and without dupliations. Each article input should have a single article counterpart in the output array of articles. If you have troubles with this requirement output an article with the original title and url values and leave the summary and genres values undefined. Never return an array output that is different in length and order than the input array of articles.\n\nAssign the most relevant genres from the list below to each article. Make sure to assign at least 1 genre per article.\n\nGENRE LIST: [Features,Opinion,How-to Guides,Reviews,Interviews,Listicles,Profiles,Tutorials,Research,Editorials,Analysis,Travel,Human Interest,Satire,Historical,Technology,Health and Wellness,Entertainment,Politics,Business & Finance,World,Environment,Science,Education,Sports,Lifestyle,Personal Finance,Science Fiction and Fantasy,Parenting & Family,Food and Cooking,History and Archaeology,Weather,Recreation,Art,Shopping,Home,Agriculture,Animals & Wildlife,Vacation,Fashion,Music,Film & TV,Gaming,Literature,Cultural,Social,Fitness & Exercise,DIY and Home Improvement,Mental Health,Automotive,Photography,Religion,Career & Work,Social Media,Crime]",
});

const dailyRecapSummarizerModel = genAI.getGenerativeModel({
    model: MODEL_NAME,
    safetySettings: safetySettings,
    systemInstruction: "You are an expert article writer. \n\n**INPUT:**\nAn array of articles in JSON format, where each article object has:\ntitle: string,\nsummarizedContent: string,\n\n**TASK:**\n1. Write a brief, concise paragraph that captures only the most important events or facts, without redundancy. Limit your answer strictly to 80 tokens or 60 words, using two sentences at most. Brevity is crucial.\n\n2. Suggest an adequate, compelling title that is relevant",
})

const articleSummarizerModel_generationConfig = {
    temperature: 0.65,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
    responseSchema: {
        type: "object",
        properties: {
            response: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        title: {
                            type: "string"
                        },
                        url: {
                            type: "string"
                        },
                        summary: {
                            type: "string"
                        },
                        genres: {
                            type: "array",
                            items: {
                                type: "string"
                            }
                        }
                    },
                    required: [
                        "title",
                        "url",
                        "summary",
                        "genres"
                    ]
                }
            }
        },
        required: [
            "response"
        ]
    },
};

const dailyRecapSummarizerModel_generationConfig = {
    temperature: 0.7,
    topP: 1,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
    responseSchema: {
        type: "object",
        properties: {
            title: {
                type: "string"
            },
            summary: {
                type: "string"
            }
        },
        required: [
            "title",
            "summary"
        ]
    },
};

async function assignAndSummarize(articlesArray) {
    // MESSAGE consits of all the articles in an array with props: title, url, content
    var MESSAGE = `${JSON.stringify(articlesArray.map(article => ({
        title: article.title,
        url: article.url,
        content: article.body
    })), null, 4)}`

    try {
        const chatSession = articleSummarizerModel.startChat({
            generationConfig: articleSummarizerModel_generationConfig,
            history: []
        });

        const gemini_response = await chatSession.sendMessage(MESSAGE)
        while (gemini_response.status != 200) {
            gemini_response = await chatSession.sendMessage(MESSAGE)
        }
        
        const result = JSON.parse(gemini_response.response.text())
        return result;

    } catch (error) {
        console.error(error);
        return null;
    }
}

async function createDailyRecapSummaryAndTitle(articlesArray) {
    // MESSAGE consits of all the articles in an array with props: title, url, content
    var MESSAGE = `${JSON.stringify(articlesArray.map(article => ({
        title: article.title,
        summarizedContent: article.summarizedContent
    })), null, 4)}`;

    try {
        const chatSession = dailyRecapSummarizerModel.startChat({
            generationConfig: dailyRecapSummarizerModel_generationConfig,
            // safetySettings,
            history: [
            ],
        });

        const gemini_response = await chatSession.sendMessage(MESSAGE)
        const result = JSON.parse(gemini_response.response.text())
        return result;
    } catch (error) {
        console.error(error);
        return null;
    }
}

module.exports = {
    assignAndSummarize,
    createDailyRecapSummaryAndTitle
}