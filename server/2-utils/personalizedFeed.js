function articleScore(article, userPreferences, weights) {
    const k = weights.SMOOTHNESS; // Constant for smoothness
    const lambda = weights.EXPLORATION || 0.1; // Weight for exploration, default to 0.1 if not provided

    // Factors that will affect the Algorithm Ranking
    /* 1. Engagement -> How many people viewed and engaged with the article.
        Things such as amount of clicks, shares, read original article and users who save the article in bookmarks,
        should all affect the engagement level of an article.
    */
    const engagementFactor = (article.engagements.clicks +
        article.engagements.shares +
        article.engagements.originalArticleReads) /
        (article.engagements.clicks + k) || 0;

    /* 2. Relevance: How relevant and important each article is considering data like, 
        2a. user's interest ( genres, sources, keywords, concepts ... )
        2b. location ( i don't have yet )
        2c. behavior ( what articles does he skip or read original. At what time of the day does he read certain articles ...)
    */

    const { genre: articleGenres, source: articleSource } = article;
    const { genres: userGenres, sources: userSources, totalGenreClicks, totalSourceClicks } = userPreferences;

    // Helper function to get user preference score for a property with logarithmic scaling
    const getUserPreferenceScore = (property, userPreferences) => {
        const clicks = userPreferences.find(p => p.name.toLowerCase() === property.toLowerCase())?.clicks || 1;
        return Math.log(1 + clicks);
    };

    // Calculate genre score
    let genreScore = 0;
    articleGenres.forEach(genre => {
        if (genre != 'World') { // Dont include 'World' genre       
            const userGenreScore = getUserPreferenceScore(genre, userGenres);
            genreScore += userGenreScore;
        }
    });
    genreScore = totalGenreClicks > 0 ? genreScore / totalGenreClicks : 1;

    // Calculate source score with normalization
    const sourceScore = getUserPreferenceScore(articleSource, userSources);
    const normalizedSourceScore = totalSourceClicks > 0 ? sourceScore / totalSourceClicks : 1;

    // Feature value for document
    const genreFeatureValue = genreScore * (weights.GENRE || 1);
    const sourceFeatureValue = normalizedSourceScore * (weights.SOURCE || 1);

    /* 3. Timeliness which i already implement by sorting and scoring more recent articles while leaving older articles
        to be seen when scrolling in the feed.
    */

    /* 4. Damping. I always want to show the user new information. Therefore articles that have already been shown should
        receive a lower score after damping
    */

    // Combine feature values
    const documentScore = genreFeatureValue + sourceFeatureValue;

    // Randomness/exploration factor
    const R_d = Math.random(); // Random score for exploration
    const explorationFactor = lambda * R_d;

    // Final score combining document score with exploration factor
    const finalScore = documentScore + (engagementFactor * weights.ENGAGEMENT) + explorationFactor;
    return finalScore;
}


module.exports = {
    articleScore
}