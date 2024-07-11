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

YOU MUST OUTPUT AND ARRAY OF JSON OBJECTS. MAKE SURE TO PROPERLY CLOSE EACH JSON OBJECT ( ARTICLE ) AND THE ARRAY.

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
        "summary": "This is a concise summary of the first article, providing the key points in 100 words or less.",
        "genres": ["Genre1", "Genre2"]
    },
    {
        "title": "Sample Article 2",
        "url": "https://example.com/article2",
        "summary": "This is a concise summary of the second article, providing the key points in 100 words or less.",
        "genres": ["Genre1", "Genre2", "Genre3"]
    },
    ...
]`;

const TASK = `**TASK**
For each article in the array, you must apply the requirements of JOB1 and JOB2. Both JOB1 and JOB2 are mandatory and cannot be skipped. Each job is a specific task that should be performed on every article in the array. Refer to the detailed instructions and requirements for each job provided in the following messages`;

const SUMMARIZING_TASK = `**JOB1:** Summarize each article in the array in 100 WORDS OR LESS, providing a valuable summary and emphasizing the most important information found in each articles content. Do not Summarize in your own words.
FOLLOW AND IMPLEMENT ALL OF THE REQUIREMENTS BELOW!
**REQUIREMENTS**:
1. **SUMMARIZING**: Create a short, bite sized, fun and quick to read yet informative summary of the articles content. Omit redundancy and irrelevant details ensuring the summary is precise, to the point and UNDER 100 WORDS in length. The summary should be relevant and informative based solely on the article's content. Summarize the article in your own words.
2. **USAGE OF OPTIONAL AND CONDITIONAL FEATURES**: Apply optional and conditional features to summaries when appropriate. Try to incorporate quotes in most articles. Create lists in articles that mention multiple items.
3. **SAFETY**: Some articles may be flagged as unsafe by the Gemini API, resulting in an error during summarization. If you suspect an article may trigger this, use safer language in your summary to prevent errors.

**OPTIONAL FEATURES**
1. **SPEAKER QUOTES**: Include quotes attributed to individuals mentioned in the article. Always mention who said the quote. If you are unable to locate who said the quote, is probably a regular quote isn't part of the SPEAKER QUOTES optional feature. Unlike the QUOTING FROM ARTICLE section these quotes are NOT attributed to the author of the article but instead to individuals like speakers, guests, and outsider reporters that appear in the original article. Keep the quotes short and unaltered. UNDER NO CIRCUMSTANCE are you to alter the original speakers quote from the article. 
2. **QUOTING FROM ARTICLE**: Include important quotes attributed SOLELY to the author of the article. If the quote is said by someone, the quote falls under SPEAKER QUOTES and should be encased in <squote> tags. Quotes should enrich the user's reading experience by providing key insights from the original content alongside the summarized version written in your own words. UNDER NO CIRCUMSTANCE are you to alter the original quote from the article. Quotes should be short, no more than 2-3 lines in length. Quote should be enough to capture an important statement from the original article but not enough to flood your summary with someone else words
3. **BOLDING**: Bold names of important places and people that are mentioned in the article.
4. **VOCABULARY ENHANCEMENT**: Highlight meaningful vocabulary words. Do not enclose names, places, or things.

**CONDITIONAL FEATURES**
Implement each feature  in the summary if their corresponding condition is met in the article.
1. **CREATING LISTS**: If the article title or content mentions, refers to, discusses, or compares multiple items (e.g., movies, shopping items, music, budget options, etc.), you MUST create a list in the summary. Lists are crucial for enhancing clarity and structure. Failure to include a list in such cases will be considered incorrect.
    EXAMPLE: "It's summer and sunscreen is a must but are you using it correctly? Here are seven important tips to keep in mind: <ol class="list"><li>Apply sunscreen to your face daily, even in winter.</li><li>SPF in moisturizer isn't enough. </li><li>Factor 50 is best for maximum protection.</li><li>Use more sunscreen than you think you need. </li><li>Reapply it after sweating or wiping your skin.</li><li>Choose a broad-spectrum sunscreen like <quote>Anthelios UVMune 400</quote> which protects against the most penetrative UV rays.</li><li>Everyone, regardless of skin tone, needs sunscreen.</li></ol> <quote>Make every day a sunscreen day</quote> says tennis star **Jannik Sinner**."

When writing the summary make sure to adhere to the FORMATTING FOUNDATIONS listed below throughout the whole summary.
**FORMATTING FOUNDATIONS**: 
1. **SPEAKER QUOTES**: Enclose speakers quotes that fall under the SPEAKER QUOTES REQUIREMENT in <squote> tags.
    EXAMPLE: <squote>"Lets make america great again!"</squote>said Donald Trump
2. **QUOTING FROM ARTICLE**: Enclose any information that falls under the QUOTING FROM ARTICLE REQUIREMENT in <quote> tags. QUOTES are NEVER to be empty.
    EXAMPLE: A new study finds that <quote>the more a pacifier was used, the lower the child's vocabulary score.</quote>
3. **CREATING LISTS**: Format list using ONLY html lists. The list MUST HAVE class of 'list'. Each part of the list should be placed in a different list item tag.  Articles like 'Top 10 Movies to watch this summer', '7 Ways to stay protected in the sun' and '5 most important features in this years car' are example of summaries that must contain a list to cover the multiple items covered.
4. **BOLDING**:  Place two astericks ** at the beginning and two astericks at the end of the bolded name. NEVER USE A SINGLE ASTERICKS TO BOLD NAMES.
    EXAMPLES: President **Joe Biden** responded that he would be visiting **Paris** tomorrow to meet with **Emmanuel Macron**.
5. **VOCABULARY ENHANCEMENT**: Enclose significant words in <vocab> tags.
    EXAMPLE: It is <vocab>paramount</vocab> to drink water on a sunny day.

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