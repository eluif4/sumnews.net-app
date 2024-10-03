const cache = require('memory-cache')
const { getAllGenres } = require('../db/getCollections')

const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

const MODEL_NAME = "gemini-1.5-flash";
const API_KEY = process.env.GEMINI_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_INSTRUCTIONS = `Your role: You are an AI summarization expert.
Your tasks:
1. Concise summaries: Create summaries of 100 words or less, capturing the key points of each article.
2. Genre categorization: Assign accurate genre tags to each article based on its content.`;

const DATA_FORMAT = `**Data Format and Examples:**

**Input:**
An array of articles represented as JSON objects. Each article object has the following properties:
title (string): The title of the article.
url (string): The URL of the article.
content (string): The full content of the article.

**Output:**
An array of articles in the same order as the input array, with the following properties:
title (string): Title of the article (unchanged).
url (string): URL of the article (unchanged).
summary (string): A concise summary of the article (output of JOB1), with key points in 100 words or less.
genres (array): An array of relevant genre tags.

Example:
Input:
[
  {
    "title": "Sample Article 1",
    "url": "https://example.com/article1",
    "content": "This is the content of the first article."
  },
  {
    "title": "Sample Article 2",
    "url": "https://example.com/article2",
    "content": "This is the content of the second article."
  }
]

Output:
[
  {
    "title": "Sample Article 1",
    "url": "https://example.com/article1",
    "summary": "A concise summary of the first article, providing the key points in 100 words or less.",
    "genres": ["Genre1", "Genre2"]
  },
  {
    "title": "Sample Article 2",
    "url": "https://example.com/article2",
    "summary": "A concise summary of the second article, providing the key points in 100 words or less.",
    "genres": ["Genre1", "Genre2", "Genre3"]
  }
]`;

const TASK = `**TASK:**
For every article: Complete both JOB1 (summarization) and JOB2 (genre assignment).`;

const SUMMARIZING_TASK = `**JOB1: Summarize and Enhance Articles**
Task:
1. Create a concise, informative, and engaging summary for each article in the input array. 
2. Follow the specific guidelines and requirements listed below.

**Guidelines:**
1. Conciseness: Keep summaries under 100 words.
2. Relevance: Focus on the article's main points, 
3. Clarity: Use a conversational tone and avoid jargon. Write the summary as if you were the journalist of the article. The output is more of a short article than a summary of the original.
4. Structure: Follow a clear opening, body, and conclusion format. Do not repeat information in the summary that is already found in the title of the article. The opening should answer the title or the most relevant information the user is looking for when reading the title of the article.
5. Incorporate the features listed below where appropriate to enhance reading experience and understanding.
6. Safety: Avoid potentially unsafe content and use appropriate language.

**Features**
1. Quotes: Include key quotes from the article that provide significant insights or support the main points of the summary. These quotes should complement your summary by offering direct, unaltered statements from the original content.

Fallback: If you are unable to return an acceptable summary, return undefined.

Quotes Guidelines: 
Accuracy:  DO NOT modify the quotes in any way. They should be presented exactly as they appear in the article.
Length: Keep quotes concise, focusing on capturing the essence of an important idea or viewpoint from the article. Quotes should be counted as part of the summaries' 100 word limit.
Placement: Distribute quotes throughout the summary where they naturally fit, enhancing the narrative and providing a stronger connection to the original content.
Frequency: You can include multiple quotes in your summary if they help to clarify or emphasize the key points
Format: Enclose all quotes in <quote> tags.
Examples on how to use quotes in a summary: 
    Article content here, <quote>"Sunscreens should be applied every 3 hours"</quote>, more article content here

2. Lists: Create structured lists in the summary whenever the article discusses, mentions, or compares multiple items (e.g., movies, shopping items, music, budget options, etc.). The purpose of lists is to enhance clarity and organization by breaking down complex information into easily digestible parts. Use lists to present key points, comparisons, or enumerations clearly and effectively.

Lists Guidelines:
Detection: Look for enumerations, comparisons, or lists of items within the content or title of the article.
Integration: Lists can be used in conjunction with other features and free text within the summary, seamlessly integrating into the overall narrative.
Integration: Lists can be used in conjunction with other features and free text within the summary, seamlessly integrating into the overall narrative.
Format: Create lists in your summaries using HTML <ol> or <ul> tags. Ensure the list has a class attribute set to "list."  Each part of the list should be placed within a <li> tag. Ensure each list item conveys a clear and specific point.
Example: <ol class="list">
    <li>First list item content here</li>
    <li>Second list item content here</li>
    <li>Third list item content here</li>
    ...
</ol>

**Rules**
Never produce information that isn't provided, found or mentioned in an articles content.
Adhere to the word limit and avoid irrelevant information.
Write summaries as if you were the journalist.
Avoid promotional or subscription-related content.
Use quotes correctly and avoid excessive quoting.`;

const ASSIGN_GENRE_TASK = `**JOB2: Classify Articles by Genre**
Task:
Assign the most relevant genre(s) to each article based on its title, content, and a provided genre list.

**Guidelines:**
Relevance: Prioritize genres that closely match the article's content or theme.
Format: Return genres as an array, with the most relevant genres listed first.

**Rules:**
Always return at least one genre.
Only user genres from the provided list.

Fallback: If unable to determine a relevant genre, return "World"`

var GENRE_LIST = `GENRE LIST: `

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

const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    system_instruction: SYSTEM_INSTRUCTIONS,
});

const generationConfig = {
    temperature: 1,
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

async function assignAndSummarize(articlesArray) {
    const cachedGenres = cache.get('genres');
    var allGenres = cachedGenres ? cachedGenres : await getAllGenres();
    const genres = allGenres.map(genreObj => genreObj.genre);

    GENRE_LIST = `GENRE LIST: [${genres}]`;
    var MESSAGE = `INPUT ( Array of articles, each article represented as a JSON object ):
        ${JSON.stringify(articlesArray.map(article => ({
        title: article.title,
        url: article.url,
        content: article.body
    })), null, 4)}`

    try {
        const chatSession = model.startChat({
            generationConfig,
            safetySettings,
            history: [
                {
                    role: "user",
                    parts: [
                        { text: DATA_FORMAT },
                        { text: TASK },
                        { text: SUMMARIZING_TASK },
                        { text: ASSIGN_GENRE_TASK },
                        { text: GENRE_LIST },
                    ]
                }
            ]
        })

        const gemini_response = await chatSession.sendMessage(MESSAGE)
        const result = JSON.parse(gemini_response.response.text())
        return result;
    } catch (error) {
        console.error(error)
    }
}

module.exports = {
    assignAndSummarize
}