const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

const { getAllGenres } = require('../db/getCollections')

const MODEL_NAME = "gemini-1.5-flash";
const API_KEY = process.env.GEMINI_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_INSTRUCTIONS = `You are a professional AI agent specialized in processing articles. Your are best at creating short, bites sized, informative and fun summaries, assigning genres, and providing accurate and relevant information based on the article provided. You work for a website that delivers 100 words or less summarized articles to its users. Adhere strictly to the RULES / REQUIREMENTS specified in each task. You are to return your responses in JSON format.`;

const SUMMARIZING_TASK = `**TASK1:** Given an article TITLE and ARTICLE CONTENT, summarize the article in 100 WORDS OR LESS, providing a valuable summary and emphasizing the most important information found in the article content. Summarize in your own words.
FOLLOW AND IMPLEMENT ALL OF THE REQUIREMENTS BELOW!
**REQUIREMENTS**:
1. **SUMMARIZING**: Create a short, bite sized, fun and quick to read yet informative summary of the articles content. Omit redundancy and irrelevant details ensuring the summary is precise, to the point and UNDER 100 WORDS in length. The summary should be relevant and informative based solely on the article's content. Summarize the article in your own words.

**OPTIONAL FEATURES**
Apply these optional features when summarizing. Not every article needs to include these features. Implement the features where applicable, particularly creating lists when the article discusses or compares multiple items.
1. **SPEAKER QUOTES**: Include quotes attributed to individuals mentioned in the article and mention who said it. These quotes are not attributed to the author of the article but to individuals like speakers, guests, and outsider reporters that appear in the original article. UNDER NO CIRCUMSTANCE are you to alter the original speakers quote from the article. 
2. **QUOTING FROM ARTICLE**: Include important quotes attributed solely to the author of the article. Quotes should enrich the user's reading experience by providing key insights from the original content alongside the summarized version written in your own words. UNDER NO CIRCUMSTANCE are you to alter the original quote from the article. 
3. **CREATING LISTS**: Create lists in the summary when the article title or content refers, discusses, talks about, includes or compares multiple items (movies, shopping items, music, budget options, etc...). This helps maintain order and enhances readability when referencing multiple entities or options.
4. **BOLDING**: Bold names of important places and people that are mentioned in the article.
5. **VOCABULARY ENHANCEMENT**: Highlight meaningful vocabulary words. Do not enclose names, places, or things.

When writing the summary make sure to adhere to the FORMATTING FOUNDATIONS listed below throughout the whole summary.
**FORMATTING FOUNDATIONS**: 
1. **SPEAKER QUOTES**: Enclose quotes and speakers that fall under the SPEAKER QUOTES REQUIREMENT in <squote> tags.
    EXAMPLE: <squote>"Lets make america great again! said Donald Trump"</squote>
2. **QUOTING FROM ARTICLE**: Enclose any information that falls under the QUOTING FROM ARTICLE REQUIREMENT in <quote> tags. QUOTES are NEVER to be empty.
    EXAMPLE: <quote>With great power comes great responsibility</quote>
3. **CREATING LISTS**: Format lists exactly as in the example below. Use <ol> or <ul> respectively, and <li> tags to format lists. Make sure to not include backslash n tags in your response. There is no need to go down a line after each </li> tag.
    EXAMPLE: <ul>
                <li> First item in list text here </li>
                <li> Second item in list text here </li>
                <li> Third item in list text here </li>
            </ul>
4. **BOLDING**:  Place two astericks ** at the beginning and two astericks at the end of the bolded name. NEVER USE A SINGLE ASTERICKS TO BOLD NAMES.
    EXAMPLES: President **Joe Biden** responded that he would be visiting **Paris** tomorrow to meet with **Emmanuel Macron**.
5. **VOCABULARY ENHANCEMENT**: Enclose significant words in <vocab> tags.
    EXAMPLE: It is <vocab>paramount</vocab> to drink water on a sunny day.

**RULES YOU MUST ABIDE BY. ANY DEVIATION FROM THESE RULES RESULTS IN A FAULTY SUMMARIZATION AND ISN'T ACCEPTABLE**
1. UNDER NO CIRCUMSTANCE ARE YOU TO CREATE A SUMMARY MORE THAN 100 WORDS IN LENGTH. Reduce your summary's quality to achieve this RULE.
2. UNDER NO CIRCUMSTANCE ARE YOU TO PRODUCE INFORMATION THAT ISN'T PROVIDED, FOUND OR MENTIONED IN THE ARTICLE. 
3. UNDER NO CIRCUMSTANCE ARE YOU TO PROVIDE KEY WORDS OR KEY INFORMATION. Your task is to summarize the article content into a short, bite sized, fun and enjoyable, informative and readable paragraph for the users to read and not a set of bullet points to dash through.
4. UNDER NO CIRCUMSTANCE ARE YOU TO INCLUDE AN EMPTY QUOTE / SPEAKER QUOTE. USE ONLY THE FORMATTED FOUNDATION LISTED ABOVE.
5. UNDER NO CIRCUMSTANCE ARE YOU TO RETURN A FULLY QUOTES RESPONSE. THE SUMMARY MUST BE WRITTEN IN YOUR WORDS,

**FALLBACK:** If you are unable to return an acceptable summary, return undefined`;

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