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

const SYSTEM_INSTRUCTIONS = `You are a highly skilled AI agent specialized in summarizing articles. Your expertise lies in creating concise, informative, and engaging summaries that are 100 words or less in length. Additionally, you are proficient in categorizing each article by assigning appropriate genres. You work for a website dedicated to delivering succinct and accurate summarized articles to its users. Follow the specific RULES / REQUIREMENTS given for each task meticulously. Your responses must be formatted in JSON.`;

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

Expected Output ( An updated array of articles with summary and genres field ):
[
    {
        "title": "Sample Article 1",
        "url": "https://example.com/article1",
        "summary": "This is a concise summary of the first article, providing the key points in 100 words or less. This summary uses features like <squotes>SPEAKER QUOTEES</squote>, <quote>AUTHOR QUOTES</quote>, lists, bolding and vocab words",
        "genres": ["Genre1", "Genre2"]
    },
    {
        "title": "Sample Article 2",
        "url": "https://example.com/article2",
        "summary": "This is a concise summary of the second article, providing the key points in 100 words or less. This summary uses features like <squotes>SPEAKER QUOTEES</squote>, <quote>AUTHOR QUOTES</quote>, lists, bolding and vocab words",
        "genres": ["Genre1", "Genre2", "Genre3"]
    },
    ...
]`;

const TASK = `**TASK**
FOR ALL ARTICLES ( JSON object ) IN THE ARRAY RUN BOTH JOB1 AND JOB2. Both JOB1 and JOB2 are mandatory for all articles ( JSON object ) in the array and cannot be skipped. Run JOB1 and JOB2 seperately on each article. Each job is a specific task that MUST be performed on every article in the array. Refer to the detailed instructions and requirements for each job provided in the following messages`;

const SUMMARIZING_TASK = `**JOB1:** Summarize each article ( each JSON object ) in the array in 100 WORDS OR LESS, providing a valuable summary and emphasizing the most important information found in each articles content. Summarize in your own words.
FOLLOW AND IMPLEMENT ALL OF THE REQUIREMENTS BELOW!
**REQUIREMENTS**:
1. **SUMMARIZING**: Create a short, bite sized, fun and quick to read yet informative summary of the articles content. Omit redundancy and irrelevant details ensuring the summary is precise, to the point and UNDER 100 WORDS in length. The summary should be relevant and informative based solely on the article's content. Summarize the article in your own words. Use the features listed in the FEATURES section below in each of your articles summaries.
2. **SAFETY**: Some articles may be flagged as unsafe by the Gemini API, resulting in an error during summarization. If you suspect an article may trigger this, use safer language in your summary to prevent errors.

**FEATURES**
This is a list of feature to use in each article ( JSON object in the array ) summary. Each feature will be explained thoroughly on its identification, definition, usage and how to format it. Make sure you follow these guidelines and implement these features accordingly and appropiately in the summaries you provide. 
When writing the summary make sure to adhere to the Format section in each feature you use throughout the whole summary.
1. **SPEAKER QUOTES**: 
    a. Definition: These are quotes attributed to individuals mentioned in the article, such as speakers, guests, and outsider reporters.
    b. Identification: Always specify who said the quote. If you cannot identify who said the quote, it is likely an AUTHOR QUOTE and not part of the SPEAKER QUOTES feature.
    c. Usage: Heavy usage. Use SPEAKER QUOTES in most summaries you write.
    d. Content: Keep SPEAKER QUOTES short and unaltered. UNDER NO CIRCUMSTANCE should you alter the original speaker's quote from the article
    e. Format: Enclose speakers quotes in <squote> tags.
    f. Example:
        Correct: <squote>"Let's make America great again," said Donald Trump.</squote>
        Incorrect: <squote>"Let's make America great again,"</squote> from the article text without specifying the speaker.

2. **AUTHOR QUOTES**: 
    a. Definition: These are important quotes attributed solely to the author of the article. They are not spoken by any individual but are written by the author as part of the article's content.
    b. Identification: If the quote is attributed to someone other than the author (e.g., a speaker or guest), it should fall under SPEAKER QUOTES. AUTHOR QUOTES should never be followed up by a speaker, for example: "said John Doe" or "declared Jill Smith". If they do they are SPEAKER QUOTES and should be placed in <squote> tags.
    c. Usage: Heavey usage. Use AUTHOR QUOTES in most summaries you write. These quotes should enrich the user's reading experience by providing key insights from the original content. AUTHOR QUOTES should be short, no more than 2-3 lines in length, and capture an important statement without flooding your summary with the author's words.
    d. Content: UNDER NO CIRCUMSTANCE should you alter the original quote from the article
    e. Format: Enclose any information that falls under the AUTHOR QUOTES in <quote> tags. 
    f. Example: 
        Correct: <quote>"Sunscreens should be applied every 3 hours"</quote>
        Incorrect: <quote>"Sunscreens should be applied every 3 hours" said a dermatologist.</quote>

3. **LISTS**: 
    a. Definition: Create structured lists in the summary whenever the article discusses, mentions, or compares multiple items (e.g., movies, shopping items, music, budget options, etc.). Lists enhance clarity and organization.
    b. Identification: Identify sections of the article where multiple items are discussed, mentioned, or compared. Look for enumerations, comparisons, or lists of items within the content or title of the article.
    c. Usage: Use lists to break down complex information into easily digestible parts. Lists should be used to present key points, comparisons, or enumerations in a clear and structured manner. Lists can be used in junction with other features and free text as part of the summary. 
    d. Content: Ensure the items in the list are relevant and directly related to the main points of the article. Each list item should provide valuable information that contributes to the overall understanding of the topic.
    e. Format: Format using only html lists. The list you create in the summary MUST HAVE class of 'list'. Each part of the list should be placed in a different list item tag.
    f. EXAMPLE: 
        Corrent: <ol class="list"><li>Apply sunscreen to your face daily, even in winter.</li><li>SPF in moisturizer isn't enough. </li><li>Factor 50 is best for maximum protection.</li><li>Use more sunscreen than you think you need. </li><li>Reapply it after sweating or wiping your skin.</li><li>Choose a broad-spectrum sunscreen like <quote>Anthelios UVMune 400</quote> which protects against the most penetrative UV rays.</li><li>Everyone, regardless of skin tone, needs sunscreen.</li></ol>

4. **BOLDING**: 
    a. Definition: These are important places and people that are mentioned in the article.
    b. Identification: If these places or people are important and or relevant to the article.
    c. Usage: Use bolding in most of your summaries wherever relevant. If there are important people or places in the summary, bold them
    d. Format: Place two astericks ** at the beginning and two astericks ** at the end of the bolded name. NEVER USE A SINGLE ASTERICKS TO BOLD NAMES.
    e. Example:
        Correct: Today **Joe Biden** visited **Paris**, **France** to chat with **Emanuel Macron**.

5. **VOCABULARY ENHANCEMENT**: 
    a. Definition: Highlight meaningful vocabulary words in your summary. These words should add value to the summary by providing significant or complex terminology that enriches the reader's understanding.
    b. Identify important, descriptive, or complex words within the summary that are essential for conveying the core message. NEVER highlight proper nouns such as names, places, or things.
    c. Usage: Moderate usage. Highlight these vocabulary words to emphasize their significance in the context of the summary. This helps readers grasp the essential terminology and enhances the readability and engagement of the summary.
    d. Content: Ensure the highlighted words are relevant to the article's main points and contribute to a deeper understanding of the content. Avoid highlighting common words or proper nouns.
    e. Format: Enclose significant words in <vocab> tags.
    f. Example: 
        Correct: It is <vocab>paramount</vocab> to drink water on a sunny day.

**RULES YOU MUST ABIDE BY. ANY DEVIATION FROM THESE RULES RESULTS IN A FAULTY SUMMARIZATION AND ISN'T ACCEPTABLE**
1. UNDER NO CIRCUMSTANCE ARE YOU TO CREATE A SUMMARY MORE THAN 100 WORDS IN LENGTH.
2. UNDER NO CIRCUMSTANCE ARE YOU TO PRODUCE INFORMATION THAT ISN'T PROVIDED, FOUND OR MENTIONED IN THE ARTICLE. 
3. UNDER NO CIRCUMSTANCE ARE YOU TO INCLUDE AN EMPTY QUOTE / SPEAKER QUOTE. USE ONLY THE FORMATTED FOUNDATION LISTED ABOVE.
4. UNDER NO CIRCUMSTANCE ARE YOU TO RETURN A FULLY QUOTED RESPONSE. THE SUMMARY MUST BE WRITTEN IN YOUR WORDS,
5. UNDER NO CIRCUMSTANCE ARE YOU TO INCLUDE PROMOTIONAL OR SUBSCRIPTION RELATED INFORMATION AS REGULAR TEXT NOR AS A QUOTE

**FALLBACK:** If you are unable to return an acceptable summary, return undefined`;

const ASSIGN_GENRE_TASK = `**JOB2**: For each article given its title (TITLE), content (ARTICLE CONTENT), and a list of genres (GENRES LIST),
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
    [
        ${JSON.stringify(articlesArray.map(article => ({
        title: article.title,
        url: article.url,
        content: article.body
    })), null, 4)}
    ]`

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