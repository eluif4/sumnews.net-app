const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");

const { getAllGenres } = require('../db/getCollections')

const MODEL_NAME = "gemini-1.5-flash";
const API_KEY = process.env.GEMINI_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const summarizeTask = `TASK: Summarize the following article in 100 WORDS OR LESS, highlighting key points, valuable text and emphasizing the most important information. 
FOLLOW AND IMPLEMENT ALL OF THE REQUIREMENTS BELOW!
REQUIREMENTS: 
1. SUMMARIZING: Omit redundancy and irrelevant details, ensuring the summary is precise and UNDER 100 WORDS, relevant, and informative based solely on the article's content. 
2. FORMATTING FOUNDATIONS: The list below outlines how to format your response, from most to least important. 
        1. If necessary nest format options, such as quoting a sentence while using vocabulary tags around a word in that quote. Examples:
		1. <quote>With great power comes great <vocab>responsibility</vocab></quote>
		2. <squote> When we don't all stand together with our razor-thin majority, then they have a better <vocab>negotiation</vocab> position, We got to realize I can't throw a <vocab>Hail Mary</vocab> pass on every single play. It's three yards and a cloud of dust, right?</squote>
	2a. VOCABULARY: Enclose any word or words that fall under the VOCABULARY ENHANCEMENT requirement between <vocab> and </vocab> tags.
	EXAMPLE: It is <vocab>paramount</vocab> to drink water on a sunny day.
	2b. SPEAKER QUOTES: Place quotes from the article's speakers and that fall under the SPEAKER QUOTES requirement between <squote> and </squote> tags. 
	EXAMPLES: <squote>"Lets make america great again!"</squote>
	2c. QUOTES: Any information that falls under the QUOTING FROM ARTICLE requirement should be placed between <quote> and </quote> tags. QUOTES are NEVER to be empty.
	2d. LISTS: Use <ol> or <ul> and <li> tags to format lists. Use them sparingly and only when the original article includes a list that could be helpful to the user. Give a relevant title to the list.
	EXAMPLE: <b>Cheapest cars of 2024</b> <ol><li>Honda Civic</li><li>Ford Focus</li><li>Toyota Corolla</li></ol>
	2e. BOLDING:  You are only bold names of places and people. Place ** around the word or words you want to bold.
	EXAMPLES:  President **Joe Biden** responded that he would be visiting **Paris** tomorrow to meet with **Emmanuel Macron**.
3. SPEAKER QUOTES: Include quotes attributed to individuals mentioned in the article in the summary. Individuals like speakers, guests, and outsider reports. These quotes are not attributed to the author of the article. UNDER NO CIRCUMSTANCE are you to alter the original quote from the article. Place every speaker quote between <squote> and </squote> tags.
3. QUOTING FROM ARTICLE: Include important quotes attributed solely to the author of the article in between <quote> and </quote> tags. Quote key information found in the article word for word. Quotes should enrich the user's reading experience by providing key insights from the original content alongside the summarized version. UNDER NO CIRCUMSTANCE are you to change the content of the information you quote.
4. VOCABULARY ENHANCEMENT: Identify and enclose meaningful vocabulary words regarding the article content and subject within <vocab> and </vocab> tags. I don't understand english very well and would like to highlight new words to learn. NEVER enclose personalities, places, things or names with <vocab> tags. Only enclose words that have a meaning and that I can look up in the dictionary.

The following is a list of RULES YOU HAVE TO AT ALL COST ABIDE BY. Any deviation from these set of rules result in a faulty summarization and will not be acceptable:
1. UNDER NO CIRCUMSTANCE ARE YOU TO CREATE A SUMMARY WITH MORE THAN 100 WORDS. If you have to, cut down on the quality of the article to achieve this RULE.
2. UNDER NO CIRCUMSTANCE ARE YOU TO PRODUCE INFORMATION THAT ISN'T PROVIDED, FOUND OR MENTIONED IN THE ARTICLE. 
3.  UNDER NO CIRCUMSTANCE ARE YOU TO PROVIDE KEY WORDS OR KEY INFORMATION. Your task is to summarize the article content into a short, enjoyable and informative readable paragraph and not a set of bullet points to dash through.
4. UNDER NO CIRCUMSTANCE ARE YOU TO INCLUDE AN EMPTY QUOTE USING OR PLACE A QUOTE IN PARENTHESES. USE ONLY THE FORMATTED FOUNDATION LISTED ABOVE.

FALLBACK: If you don't have enough information about the article, fail in any other RULE written above or aren't able to make a reasonable summary in 100 words or less return the single word "Error".`

const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: summarizeTask,
});

const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

// FUTURE CHANGE: summarize the article based on the leading genre of the article. Give different prompts for each article genre
async function summarizeArticleWithGemini(article) {

    const parts = [
        {
            text: `${summarizeTask}, 
            Title: ${article.title}, 
            Article content: ${article.content}, 
            Summary: `
        },
    ];

    var summary;
    try {
        var result = await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig,
            safetySettings,
        });

        summary = result.response.candidates[0].content.parts[0].text;
        if (summary == "Error") // If Gemini doesnt crash but cant make a good enough summary
            summary = null;
    } catch (error) {
        console.error(`WARNING: ${article.url} couldnt be summarized`);
        summary = null;
    }

    return summary
}

const assignGenresTask = `TASK: Given an article title (TITLE), its content (ARTICLE CONTENT), and a list of genres (GENRES LIST),
your task is to identify and return the most relevant genre(s) that match the provided article information. 
Relevancy in this context refers to genre(s) that closely match the content or theme of the article.
REQUIREMENTS: 1. Your response must be in an array format. EXAMPLE: [genre1, genre2, genre3...].
2. ALWAYS return at least a single relevant genre.
3. NEVER return a genre that isnt in the list of genres provided.
4. Return genres based on their RELEVANCE. The most relevant genres first and the least relevant last.
FALLBACK: If by any chance you aren't able to return a relevant genre return [World].`

async function assignGenreWithGemini(article) {

    const parts = [
        {
            text: `${assignGenresTask},
        TITLE: ${article.title}, 
        ARTICLE CONTENT: ${article.body}, 
        GENRES LIST: ${await genres()},
        CHOSEN GENRES: `
        },
    ];

    var chosenGenres;

    try {
        var result = await model.generateContent({
            contents: [{ role: "user", parts }],
            generationConfig,
            safetySettings,
        });

        chosenGenres = result.response.candidates[0].content.parts[0].text;
        if (chosenGenres.length == 0) {
            chosenGenres.push("World");
        }
    } catch (error) {
        console.error(`WARNING: couldnt assign genres to ${article.url}. Default genre assigned [World]`);
        chosenGenres = '[World]'
    }

    return chosenGenres
}

// Returns only the name of the genres instead of the whole object from the DB
const genres = async () => {
    const allGenres = await getAllGenres();
    const genreNames = allGenres.map(genreObj => genreObj.genre);
    const filteredGenres = genreNames.filter(genre => genre !== "All");
    return filteredGenres;
};


module.exports = {
    summarizeArticleWithGemini,
    assignGenreWithGemini
}