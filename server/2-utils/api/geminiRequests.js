const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

const { getAllGenres } = require('../db/getCollections')

const MODEL_NAME = "gemini-1.5-flash";
const API_KEY = process.env.GEMINI_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_INSTRUCTIONS = `You are a professional AI agent specializing in processing articles in 100 WORDS OR LESS (ABOUT 133 TOKENS), summarizing, assigning genres, and providing accurate and relevant information. You work for a website that delivers summarized articles to its users. Adhere strictly to the RULES / REQUIREMENTS specified in each task and provide maximum value to the users. Return your responses in JSON format.`;

const SUMMARIZING_TASK = `**TASK1:** Given an article title (TITLE) and its full content (ARTICLE CONTENT), summarize the article in 100 WORDS OR LESS (ROUGHLY 133 TOKENS), providing a valuable summary and emphasizing the most important information relative to the article content. Use your own words to summarize and express the main point of the article while also quoting useful information from the original article.
FOLLOW AND IMPLEMENT ALL OF THE REQUIREMENTS BELOW!
**REQUIREMENTS**:
1. **SUMMARIZING**: Omit redundancy and irrelevant details from the original article, ensuring the summary is precise and UNDER 100 WORDS. The summary should be relevant and informative based solely on the article's content. Summarize the article in your own words.
2. **SPEAKER QUOTES**: (OPTIONAL) Include quotes attributed to individuals mentioned in the article. After the quote mention who said it. These quotes are not attributed to the author of the article but to individuals like speakers, guests, and outsider reporters that appear in the original article. UNDER NO CIRCUMSTANCE are you to alter the original quote from the article. Place every speaker quote and it speaker between <squote> and </squote> tags.
3. **QUOTING FROM ARTICLE**: Include important quotes attributed solely to the author of the article between <quote> and </quote> tags. Quote key information found in the article word for word. Quotes should enrich the user's reading experience by providing key insights from the original content alongside the summarized version written in your words. UNDER NO CIRCUMSTANCE are you to change the content of the information you quote.
4. **VOCABULARY ENHANCEMENT**: Highlight meaningful vocabulary words within <vocab> tags. Do not enclose names, places, or things.

**FORMATTING FOUNDATIONS**: Format your summary using the following tags.
    1. If necessary nest format options. Examples:
		1a. <quote>With great power comes great <vocab>responsibility</vocab></quote>
		1b. <squote> When we don't all stand together with our razor-thin majority, then they have a better <vocab>negotiation</vocab> position, We got to realize I can't throw a <vocab>Hail Mary</vocab> pass on every single play. It's three yards and a cloud of dust, right?</squote>
	2. **SPEAKER QUOTES**: Enclose quotes and speakers that fall under the SPEAKER QUOTES REQUIREMENT in <squote> tags.
		EXAMPLE: <squote>"Lets make america great again! said Donald Trump"</squote>
	3. **QUOTES**: Enclose any information that falls under the QUOTING FROM ARTICLE REQUIREMENT in <quote> tags. QUOTES are NEVER to be empty.
        EXAMPLE: <qoute>With great power comes great responsibility</quote>
	4. **LISTS**: Use <ol>, <ul> and <li> tags to format lists, sparingly.
	5. **BOLDING**:  Bold names of places and people using two asterisks (**).
		EXAMPLES: President **Joe Biden** responded that he would be visiting **Paris** tomorrow to meet with **Emmanuel Macron**.
	6. **VOCABULARY ENHANCEMENT**: Enclose significant words in <vocab> tags.
		EXAMPLE: It is <vocab>paramount</vocab> to drink water on a sunny day.

**RULES YOU MUST ABIDE BY. Any deviation from these rules results in a faulty summarization and isnt acceptable**
1. UNDER NO CIRCUMSTANCE ARE YOU TO CREATE A SUMMARY WITH MORE THAN 100 WORDS. Reduce your summarys quality to achieve this RULE.
2. UNDER NO CIRCUMSTANCE ARE YOU TO PRODUCE INFORMATION THAT ISN'T PROVIDED, FOUND OR MENTIONED IN THE ARTICLE. 
3. UNDER NO CIRCUMSTANCE ARE YOU TO PROVIDE KEY WORDS OR KEY INFORMATION. Your task is to summarize the article content into a short, enjoyable, informative and readable paragraph for the users to read and not a set of bullet points to dash through.
4. UNDER NO CIRCUMSTANCE ARE YOU TO INCLUDE AN EMPTY QUOTE USING OR PLACE A QUOTE IN PARENTHESES. USE ONLY THE FORMATTED FOUNDATION LISTED ABOVE.
5. UNDER NO CIRCUMSTANCE ARE YOU TO RETURN A FULLY QUOTES RESPONSE. THE SUMMARY NEED TO BE IN YOUR OWN WORDS.

**FALLBACK:** If you cannot provide a summary under 100 words or fail any rule, return undefined`;

const ASSIGN_GENRE_TASK = `**TASK2**: Given an article title (TITLE), its content (ARTICLE CONTENT), and a list of genres (GENRES LIST),
your task is to identify and return the most relevant genre(s) (at most 5 genres) that match the provided article information. 
Relevancy in this context refers to genre(s) that closely match the content or theme of the article.

**REQUIREMENTS**: 
1. Your response must be in an array format. EXAMPLE: [genre1, genre2, genre3...].
2. ALWAYS return at least a single relevant genre.
3. NEVER return a genre that isnt in the list of genres provided.
4. Return genres based on their RELEVANCE. The most relevant genres first and the least relevant last.

**FALLBACK:** If by any chance you aren't able to return a relevant genre return [World].`

const RESPONSE_FORMAT = `Return the output of TASK1 and TASK2 as the following:
{
    summary: 'output_of_task1,
    genres: 'output_of_task2
}
`

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
                     CONTENT: [${article.content}],
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
    } catch (error) {
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