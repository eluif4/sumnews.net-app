const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

const { getAllGenres } = require('../db/getCollections')

const MODEL_NAME = "gemini-1.5-flash";
const API_KEY = process.env.GEMINI_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_INSTRUCTIONS = `You are a professional AI agent specializing in processing articles in 100 WORDS OR LESS, summarizing, assigning genres, and providing accurate and relevant information. You work for a website that delivers summarized articles to its users. Adhere strictly to the RULES / REQUIREMENTS specified in each task and provide maximum value to the users. Return your responses in JSON format.`;

const SUMMARIZING_TASK = `**TASK1:** Given an article title and full content, summarize the following article in 100 WORDS OR LESS, highlighting valuable text, key points and emphasizing the most important information. Quote information from the article while also using your own words to summarize and express the main point of the article.
FOLLOW AND IMPLEMENT ALL OF THE REQUIREMENTS BELOW!
**REQUIREMENTS**:
1. **SUMMARIZING**: Omit redundancy and irrelevant details, ensuring the summary is precise and UNDER 100 WORDS, relevant, and informative based solely on the article's content. You may quote from the original article but also use your own words.
2. **FORMATTING FOUNDATIONS**:  Format your response using the following tags, nested if necessary:
        2a. If necessary nest format options. Examples:
		2a.1. <quote>With great power comes great <vocab>responsibility</vocab></quote>
		2a.2. <squote> When we don't all stand together with our razor-thin majority, then they have a better <vocab>negotiation</vocab> position, We got to realize I can't throw a <vocab>Hail Mary</vocab> pass on every single play. It's three yards and a cloud of dust, right?</squote>
	2b. **VOCABULARY**: Enclose significant words in <vocab> tags.
	EXAMPLE: It is <vocab>paramount</vocab> to drink water on a sunny day.
	2c. **SPEAKER QUOTES**: Enclose quotes from the article's speakers and that fall under the SPEAKER QUOTES REQUIREMENT in <squote> tags.
	EXAMPLE: <squote>"Lets make america great again!"</squote>
	2d. **QUOTES**: Enclose any information that falls under the QUOTING FROM ARTICLE REQUIREMENT in <quote> tags. QUOTES are NEVER to be empty.
        EXAMPLE: <qoute> With great power comes greate <vocab>responsibility</vocab></quote>
	2e. **LISTS**: Use <ol> or <ul> and <li> tags to format lists, sparingly.
	EXAMPLE: **Cheapest cars of 2024**<ol><li>Honda Civic</li><li>Ford Focus</li><li>Toyota Corolla</li></ol>
	2e. BOLDING:  Bold names of places and people using **.
	EXAMPLES:  President **Joe Biden** responded that he would be visiting **Paris** tomorrow to meet with **Emmanuel Macron**.
3. **SPEAKER QUOTES**: Include quotes from individuals mentioned in the article, in <squote> tags. Do not alter the original quotes.
4. **QUOTING FROM ARTICLE**: Include important quotes from the article author in <quote> tags. Do not change the content.
5. **VOCABULARY ENHANCEMENT**: Highlight meaningful vocabulary words within <vocab> tags. Do not enclose names, places, or things.

**RULES YOU MUST ABIDE BY. Any deviation from these rules results in a faulty summarization and isnt acceptable**
1. UNDER NO CIRCUMSTANCE ARE YOU TO CREATE A SUMMARY WITH MORE THAN 100 WORDS. If you have to, cut down on the quality of the article to achieve this RULE.
2. UNDER NO CIRCUMSTANCE ARE YOU TO PRODUCE INFORMATION THAT ISN'T PROVIDED, FOUND OR MENTIONED IN THE ARTICLE. 
3. UNDER NO CIRCUMSTANCE ARE YOU TO PROVIDE KEY WORDS OR KEY INFORMATION. Your task is to summarize the article content into a short, enjoyable and informative readable paragraph for the users and not a set of bullet points to dash through.
4. UNDER NO CIRCUMSTANCE ARE YOU TO INCLUDE AN EMPTY QUOTE USING OR PLACE A QUOTE IN PARENTHESES. USE ONLY THE FORMATTED FOUNDATION LISTED ABOVE.

**FALLBACK:** If you cannot provide a summary under 100 words or fail any rule, return undefined`;

const ASSIGN_GENRE_TASK = `**TASK2**: Given an article title (TITLE), its content (ARTICLE CONTENT), and a list of genres (GENRES LIST),
your task is to identify and return the most relevant genre(s) that match the provided article information. 
Relevancy in this context refers to genre(s) that closely match the content or theme of the article.

**REQUIREMENTS**: 
1. Your response must be in an array format. EXAMPLE: [genre1, genre2, genre3...].
2. ALWAYS return at least a single relevant genre.
3. NEVER return a genre that isnt in the list of genres provided.
4. Return genres based on their RELEVANCE. The most relevant genres first and the least relevant last.

**FALLBACK:** If by any chance you aren't able to return a relevant genre return [World].`

const RESPONSE_FORMAT = `Return the output of TASK1 and TASK2 as the following:
{
    genres: 'output_of_task2 (array),
    summary: 'output_of_task1 (string)
}`

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

async function assignAndSummarize(article) {
    const MESSAGE = `TITLE: [${article.title}],
                     CONTENT: [${article.body}],
                     GENRE LIST: [${await genres()}]`

    try {
        const chatSession = model.startChat({
            generationConfig,
            history: [
                {
                    role: "user",
                    parts: [
                        { text: SUMMARIZING_TASK },
                        { text: ASSIGN_GENRE_TASK },
                        { text: RESPONSE_FORMAT }
                    ]
                }
            ]
        })

        const result = await chatSession.sendMessage(MESSAGE)
        return JSON.parse(result.response.text()) 
    } catch(error) {
        console.error(error)
    }
}

// Returns only the name of the genres instead of the whole object from the DB
const genres = async () => {
    const allGenres = await getAllGenres();
    const genreNames = allGenres.map(genreObj => genreObj.genre);
    const filteredGenres = genreNames.filter(genre => genre !== "All");
    return filteredGenres;
};

module.exports = {
    assignAndSummarize
}