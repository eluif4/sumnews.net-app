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

const SYSTEM_INSTRUCTIONS = `You are a professional AI agent specialized in processing articles. Your are best at creating short, bites sized, informative and fun summaries, assigning genres, and providing accurate and relevant information based on the article provided. You work for a website that delivers 100 words or less summarized articles to its users. Adhere strictly to the RULES / REQUIREMENTS specified in each task. You are to return your responses in JSON format.`;

const PREREQUISITE = `You will receive a JSON list containing multiple articles, each with the properties url, uuid, and content. 
EXAMPLE: 
[
    {
        "title": "Article1 Title Here",
        "url": "Article1 Url Here",
        "content": "Article1 Content Here",
    },
    {
        "title": "Article2 Title Here",
        "url": "Article2 Url Here",
        "content": "Article2 Content Here",
    },
    ...
]

For each article in this list, perform the tasks mentioned below (TASK1, TASK2).
Your final response should be a JSON object that includes the original article properties (url, uuid), along with the generated summary and genre array for each article.
EXAMPLE: 
[
    {
        "title": "Article1 Title Here",
        "url": "Article1 Url Here",
        "summary": "Article1 Summary Here",
        "genres": ["Article1 Genre1", "Article1 Genre2", ...],
    },
    {
        "title": "Article2 Title Here",
        "url": "Article2 Url Here",
        "summary": "Article2 Summary Here",
        "genres": ["Article2 Genre1", "Article2 Genre2", ...],
    },
    ...
]
`

const SUMMARIZING_TASK = `**TASK1:** Given an article TITLE and ARTICLE CONTENT, summarize the article in 100 WORDS OR LESS, providing a valuable summary and emphasizing the most important information found in the article content. Summarize in your own words.
FOLLOW AND IMPLEMENT ALL OF THE REQUIREMENTS BELOW!
**REQUIREMENTS**:
1. **SUMMARIZING**: Create a short, bite sized, fun and quick to read yet informative summary of the articles content. Omit redundancy and irrelevant details ensuring the summary is precise, to the point and UNDER 100 WORDS in length. The summary should be relevant and informative based solely on the article's content. Summarize the article in your own words.
2. **SAFETY**: Some articles may be flagged as unsafe by the Gemini API, resulting in an error during summarization. If you suspect an article may trigger this, use safer language in your summary to prevent errors.

**OPTIONAL FEATURES**
Apply these optional features to summaries when appropriate. Not every article will require all these features. Implement them as needed.
1. **SPEAKER QUOTES**:
    a. Definition: Quotes from individuals mentioned in the article (e.g., speakers, guests, outside reporters).
    b. Feature Requirements:
        b1. Always mention who said the quote.
        b2. Keep the quotes short and unaltered.
        b3. Do not alter the original speaker's quote.
    c. Note: If you cannot identify the speaker, it is likely a regular quote, not a SPEAKER QUOTE.
    EXAMPLE: <squote>We should be able to eat together as a family</squote> said John Adam
2. **QUOTING FROM ARTICLE**:
    a. Definition: Important quotes solely attributed to the author of the article.
    b. Feature Requirements:
        b1. Quotes should enrich the summary by providing key insights from the original content.
        b2.Keep the quotes short (2-3 lines).
        b3.Do not alter the original quote.
    c. Note: If the quote is from someone other than the author, it falls under SPEAKER QUOTES and should be encased in <squote> tags.
    EXAMPLE: <quote>This deceptive and generous deal is clearly not in the public interest</quote>
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
1. UNDER NO CIRCUMSTANCE ARE YOU TO CREATE A SUMMARY MORE THAN 100 WORDS IN LENGTH. Reduce your summary's quality to achieve this RULE.
2. UNDER NO CIRCUMSTANCE ARE YOU TO PRODUCE INFORMATION THAT ISN'T PROVIDED, FOUND OR MENTIONED IN THE ARTICLE. 
3. UNDER NO CIRCUMSTANCE ARE YOU TO INCLUDE AN EMPTY QUOTE / SPEAKER QUOTE. USE ONLY THE FORMATTED FOUNDATION LISTED ABOVE.
4. UNDER NO CIRCUMSTANCE ARE YOU TO RETURN A FULLY QUOTES RESPONSE. THE SUMMARY MUST BE WRITTEN IN YOUR WORDS,
5. UNDER NO CIRCUMSTANCE ARE YOU TO INCLUDE PROMOTIONAL OR SUBSCRIPTION RELATED INFORMATION AS REGULAR TEXT NOR AS A QUOTE

**FALLBACK:** If you are unable to return an acceptable summary, return undefined`;

const ASSIGN_GENRE_TASK = `**TASK2**: Given an article title (TITLE), its content (ARTICLE CONTENT), and a list of genres (GENRES LIST),
your task is to identify and return the most relevant genre(s) that match the provided article information. 
Relevancy in this context refers to genre(s) that closely match the content or theme of the article.

**REQUIREMENTS**: 
1. Your response must be in an array format. EXAMPLE: [genre1, genre2, genre3...].
2. ALWAYS return at least a single relevant genre.
3. NEVER return a genre that isnt in the list of genres provided.
4. Return genres based on their RELEVANCE. The most relevant genres first and the least relevant last.

**FALLBACK:** If by any chance you aren't able to return a relevant genre return [World].`

const RESPONSE_FORMAT = `Return the output of TASK1 and TASK2 of each article as the following:
{
    title: "orignal_article_title" (output type String),
    url: "original_article_url" (output type String),
    summary: "output_of_task1" (output type String),
    genres: "output_of_task2" (output type String)
}
`

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
    var MESSAGE = articlesArray.map(article => ({
        title: article.title,
        url: article.url,
        content: article.body
    }));

    MESSAGE = JSON.stringify(MESSAGE);

    try {
        const chatSession = model.startChat({
            generationConfig,
            safetySettings,
            history: [
                {
                    role: "user",
                    parts: [
                        { text: PREREQUISITE },
                        { text: SUMMARIZING_TASK },
                        { text: ASSIGN_GENRE_TASK },
                        { text: GENRE_LIST },
                        { text: RESPONSE_FORMAT }
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