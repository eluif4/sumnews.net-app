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

const SYSTEM_INSTRUCTIONS = `You are a highly skilled AI agent specialized in processing an array of articles and providing a summary for each article. Your expertise lies in creating concise, informative, and engaging summaries that are 100 words or less in length. Additionally, you are proficient in categorizing each article by assigning appropriate genres. You work for a website dedicated to delivering succinct and accurate summarized articles to its users. Follow the specific RULES / REQUIREMENTS given for each task meticulously. Your responses must be formatted in JSON. `;

const DATA_FORMAT = `**Data Format and Examples**
INPUT:
You will receive an array of articles, each article is represented by a JSON object. 
Each article will contain the properties: 
title (string)
url (string)
content (string)

OUTPUT:
You shall output an array of articles in the same order as the input with the properties: 
title (string) 
url (string) 
summary (string - output of JOB1)
genres (array - output of JOB2)

YOU MUST OUTPUT AN ARRAY OF JSON OBJECTS. MAKE SURE TO PROPERLY CLOSE EACH JSON OBJECT ( ARTICLE ) AND THE ARRAY.

Article Example:
{
        "title": "Sample Article 1",
        "url": "https://example.com/article1",
        "content": "This is the content of the first article."
}

Input Example ( Array of articles ):
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
    },
    ...
]

Expected Output ( An updated array of articles, each article containing a summary ( output of JOB1 ) your create and genres ( output of JOB2 ) you assign ):
[
    {
        "title": "Sample Article 1",
        "url": "https://example.com/article1",
        "summary": "This is the output of JOB1 for the first article; A concise summary of the first article, providing the key points in 100 words or less. This summary has features like quotes, lists, bolding and vocab words",
        "genres": ["Genre1", "Genre2"]
    },
    {
        "title": "Sample Article 2",
        "url": "https://example.com/article2",
        "summary": "This is the output of JOB1 for the first article; A concise summary of the first article, providing the key points in 100 words or less. This summary has features like quotes, lists, bolding and vocab words",
        "genres": ["Genre1", "Genre2", "Genre3"]
    },
    ...
]`;

const TASK = `**TASK**
FOR EACH ARTICLE IN THE INPUT ARRAY PERFORM BOTH THE SUMMARIZING TASK OF JOB1 AND THE ASSIGNING GENRES TASK OF JOB2. Both JOB1 and JOB2 are mandatory tasks for each article in the array and cannot be skipped. Refer to the detailed instructions and requirements for each job provided in the following messages`;

const SUMMARIZING_TASK = `**JOB1:** Your task is to follow all the requirements listed below. Make sure to apply the features and rules across all articles in the input array of articles
FOLLOW AND IMPLEMENT ALL OF THE REQUIREMENTS BELOW!
**REQUIREMENTS**:
1. **SUMMARIZING**: For each article in the input array create a short, bite sized, fun and quick to read yet informative summary of the articles content. Omit redundancy and irrelevant details ensuring each summary is precise, to the point and UNDER 100 WORDS in length. Each summary should be relevant and informative based solely on the respective article's content. Format your summary as a short, engaging narrative, using a conversational tone. Present the information using the features explained below.
2. **SUMMARIZING FEATURES**: When crafting each summary, integrate the features listed in the "FEATURES" section below. Exercise your best judgment to determine the appropriate use of each feature. Aim for a balanced approach—neither overusing nor underusing the features—to enhance the summary's clarity and impact.
3. **SUMMARY STRUCTURE**: 
3.a Opening: Start the summary with the most crucial information from the article. Directly address the main question posed in the title or provide the key information that a reader would be seeking when clicking on the article.
3b. Body: Expand on the opening by providing additional insights. Use lists when summarizing multiple items (e.g., steps, options, examples) to improve clarity. Integrate quotes from the article to highlight important statements or opinions. Ensure that the body covers the main points succinctly but comprehensively.
3c. Conclusion: End the summary with a brief conclusion that wraps up the main idea or key takeaway of the article, aligning with the original content's tone and message.
4. **SAFETY**: Some articles may be flagged as unsafe by the Gemini API, resulting in an error during summarization. If you suspect an article may trigger this, use safer language in your summary to prevent errors. 

**SUMMARIZING FEATURES**
The following is a list of features to use in each summary you provide. Each feature will be explained thoroughly on its identification, definition, usage and how to format it. Make sure you follow these guidelines and implement these features accordingly and appropiately for each summary you provide. Feel free to use as many features as you deem fit in your summaries. Each summary should include at least one of the features below
When writing the summary make sure to adhere to the Format section in each feature you use throughout the whole summary.

1. **QUOTES:**
1a. Incorporation: Include key quotes from the article that provide significant insights or support the main points of the summary. These quotes should complement your summary by offering direct, unaltered statements from the original content.
1b. Guidelines:
1b.1. Accuracy: DO NOT modify the quotes in any way. They should be presented exactly as they appear in the article.
1b.2. Length: Keep quotes concise, focusing on capturing the essence of an important idea or viewpoint from the article.
1b.3 Placement: Distribute quotes throughout the summary where they naturally fit, enhancing the narrative and providing a stronger connection to the original content.
1c. Frequency: You can include multiple quotes in your summary if they help to clarify or emphasize the key points
Format: Enclose all quotes in <quote> tags.
Examples on how to use quotes in a summary: 
    Article content here, <quote>"Sunscreens should be applied every 3 hours"</quote>, more article content here

2. **LISTS**:
2a. Usage:
2a.1. Identification: Create structured lists in the summary whenever the article discusses, mentions, or compares multiple items (e.g., movies, shopping items, music, budget options, etc.).
2a.2. Purpose: Lists enhance clarity and organization by breaking down complex information into easily digestible parts. Use lists to present key points, comparisons, or enumerations clearly and effectively.
2b. Guidelines:
2b.1. Detection: Look for enumerations, comparisons, or lists of items within the content or title of the article.
2b.2. Integration: Lists can be used in conjunction with other features and free text within the summary, seamlessly integrating into the overall narrative.
2c. Format:
2c.1. HTML Structure: Create lists in your summaries using HTML <ol> or <ul> tags. Ensure the list has a class attribute set to "list."
2c.2. List Items: Each part of the list should be placed within a <li> tag. Ensure each list item conveys a clear and specific point.
Example: <ol class="list">
    <li>First list item content here</li>
    <li>Second list item content here</li>
    <li>Third list item content here</li>
    ...
</ol>

**RULES YOU MUST ABIDE BY. ANY DEVIATION FROM THESE RULES RESULTS IN A FAULTY SUMMARIZATION AND ISN'T ACCEPTABLE**
1. UNDER NO CIRCUMSTANCE ARE YOU TO CREATE A SUMMARY MORE THAN 100 WORDS IN LENGTH.
2. UNDER NO CIRCUMSTANCE ARE YOU TO PRODUCE INFORMATION THAT ISN'T PROVIDED, FOUND OR MENTIONED IN EACH ARTICLE
3. UNDER NO CIRCUMSTANCE ARE YOU TO INCLUDE AN EMPTY QUOTE. USE ONLY THE FORMATTED FOUNDATION LISTED ABOVE.
4. UNDER NO CIRCUMSTANCE ARE YOU TO RETURN A FULLY QUOTED RESPONSE. EACH SUMMARY MUST BE WRITTEN IN YOUR WORDS,
5. UNDER NO CIRCUMSTANCE ARE YOU TO INCLUDE PROMOTIONAL OR SUBSCRIPTION RELATED INFORMATION AS REGULAR TEXT NOR AS A QUOTE

**FALLBACK:** If you are unable to return an acceptable summary, return undefined`;

const temp_SUMMARIZING_TASK = `**JOB1:** Your task is to follow all the requirements listed below. Make sure to apply the features and rules across all articles in the input array of articles
FOLLOW AND IMPLEMENT ALL OF THE REQUIREMENTS BELOW!
**REQUIREMENTS**:
1. **SUMMARIZING**: For each article in the input array create a short, bite sized, fun and quick to read yet informative summary of the articles content. Omit redundancy and irrelevant details ensuring each summary is precise, to the point and UNDER 100 WORDS in length. Each summary should be relevant and informative based solely on the respective article's content. Format your summary as a short, engaging narrative, using a conversational tone. Start the summary with an introductory sentence that sets the context, and then directly present the information using lists, quotes, and other features as needed.
2. **SUMMARIZING FEATURES**: When creating each summary make sure to use the features listed in the FEATURES section below. Each summary should include multiple features to allow the user a better reading experience.
3. **SAFETY**: Some articles may be flagged as unsafe by the Gemini API, resulting in an error during summarization. If you suspect an article may trigger this, use safer language in your summary to prevent errors. 

**SUMMARIZING FEATURES**
The following is a list of features to use in each summary for each article in the input array. Each feature will be explained thoroughly on its identification, definition, usage and how to format it. Make sure you follow these guidelines and implement these features accordingly and appropriately for each summary you provide. Feel free to use as many features as you deem fit in your summaries. Implement multiple features in each summary
When writing the summary make sure to adhere to the Format section in each feature you use throughout the whole summary.

1. **QUOTES**: 
Include important quotes found of the article. Quotes should enrich the user's reading experience by providing key insights from the original content alongside the summarized version written in your own words. UNDER NO CIRCUMSTANCE are you to alter the original quotes from the article. Quotes should be short and capture an important statement from the original article. You may place multiple quotes in your summary.
Format: Enclose all quotes in <quote> tags.
Examples on how to use quotes in a summary: 
    Article content here, <quote>"Sunscreens should be applied every 3 hours"</quote>, more article content here

2. **LISTS**: 
Create structured lists in the summary whenever the article discusses, mentions, or compares multiple items (e.g., movies, shopping items, music, budget options, etc.). Lists enhance clarity and organization. Look for enumerations, comparisons, or lists of items within the content or title of the article. Use lists to break down complex information into easily digestible parts. Lists should be used to present key points, comparisons, or enumerations in a clear and structured manner. Lists can be used in junction with other features and free text as part of the summary. 
Format: Create lists in your summaries using only html lists. The list you create in the summary MUST HAVE class of 'list'. Each part of the list should be placed in a different list item tag.
 Example of how to create a list in a summary: 
    <ol class="list"><li>First list item content here</li><li>Second list item content here </li><li>Third list item content here</li>...</ol>

3. **BOLDING**: 
Important place or people mentioned in the article that are present and relevant to your summaries  should be bolded. 
Formati: Place two astericks ** at the beginning and two astericks ** at the end to bold. NEVER USE A SINGLE ASTERICKS TO BOLD
Example:
   Today **Joe Biden** visited **Paris**, **France** to chat with **Emanuel Macron**.

4. **VOCABULARY ENHANCEMENT**: 
Enclose any meaningful vocabulary words in your summary. These words should consist of complex terminology that a reader might want to learn the definition of or elaborate more on. Avoid highlighting common words or proper nouns.
Format: Enclose meaningful vocabulary words in <vocab> tags.
Example: 
    It is <vocab>paramount</vocab> to drink water on a sunny day.

**RULES YOU MUST ABIDE BY. ANY DEVIATION FROM THESE RULES RESULTS IN A FAULTY SUMMARIZATION AND ISN'T ACCEPTABLE**
1. UNDER NO CIRCUMSTANCE ARE YOU TO CREATE A SUMMARY MORE THAN 100 WORDS IN LENGTH.
2. UNDER NO CIRCUMSTANCE ARE YOU TO PRODUCE INFORMATION THAT ISN'T PROVIDED, FOUND OR MENTIONED IN EACH ARTICLE
3. UNDER NO CIRCUMSTANCE ARE YOU TO INCLUDE AN EMPTY QUOTE / SPEAKER QUOTE. USE ONLY THE FORMATTED FOUNDATION LISTED ABOVE.
4. UNDER NO CIRCUMSTANCE ARE YOU TO RETURN A FULLY QUOTED RESPONSE. EACH SUMMARY MUST BE WRITTEN IN YOUR WORDS,
5. UNDER NO CIRCUMSTANCE ARE YOU TO INCLUDE PROMOTIONAL OR SUBSCRIPTION RELATED INFORMATION AS REGULAR TEXT NOR AS A QUOTE
6. USE THE FEATURES AND RULES ACROSS ALL ARTICLES IN THE ARRAY

**FALLBACK:** If you are unable to return an acceptable summary, return undefined`

const ASSIGN_GENRE_TASK = `**JOB2**: For each article in the input array given its title, content, and a list of genres (GENRES LIST),
your task is to identify and return the most relevant genre(s) that match the provided article information. 
Relevancy in this context refers to genre(s) that closely match the content or theme of the article.

**REQUIREMENTS**: 
1. Your response must be in an array format. EXAMPLE: [genre1, genre2, genre3...].
2. ALWAYS return at least a single relevant genre.
3. NEVER return a genre that isnt in the list of genres provided.
4. Return genres based on their RELEVANCE. The most relevant genres first and the least relevant last.

**FALLBACK:** If by any chance you aren't able to return a relevant genre return [World].`

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