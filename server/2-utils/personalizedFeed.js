function articleScore(article, userPreferences, weights) {
    const k = weights.SMOOTHNESS; // Constant for smoothness
    const lambda = weights.EXPLORATION || 0.1; // Weight for exploration, default to 0.1 if not provided

    const normalize = (value, min, max) => {
        if (max === min) return 0; // Avoid division by zero
        return (value - min) / (max - min);
    }
    // Factors that will affect the Algorithm Ranking
    /* 1. Engagement -> How many people viewed and engaged with the article.
        Things such as amount of clicks, shares, read original article and users who save the article in bookmarks,
        should all affect the engagement level of an article.
    */

    // Engagement Factor (normalized)
    // const engagementTotal = article.engagements.clicks + article.engagements.shares + article.engagements.originalArticleReads;
    // const engagementFactor = normalize(engagementTotal, 0, article.engagements.clicks + k) || 0;

    const engagementFactor = article.engagements.clicks > 0 ? (article.engagements.shares + article.engagements.originalArticleReads) / (article.engagements.clicks * 2) : 0;

    /* 2. Relevance: How relevant and important each article is considering data like, 
        2a. user's interest ( genres, sources, keywords, concepts ... )
        2b. location ( i don't have yet )
        2c. behavior ( what articles does he skip or read original. At what time of the day does he read certain articles ...)
    */

    // Helper function to get user preference score for a property with logarithmic scaling
    const getUserPreferenceScore = (property, userPreferences) => {
        const clicks = userPreferences.find(p => p.name.toLowerCase() === property.toLowerCase())?.clicks || 0;
        return Math.log(1 + clicks);
    };

    // Genre Score (normalized)
    const { genre: articleGenres, source: articleSource } = article;
    const { genres: userGenres, totalGenreClicks } = userPreferences;

    // FUTURE CHANGE: CALC ALL GENRES TOGETHER AND THEN LOG THEM BETWEEN 0 AND 1
    let genreScore = 0;
    articleGenres.forEach(genre => {
        if (genre != 'World') { // Dont include 'World' genre       
            const userGenreScore = getUserPreferenceScore(genre, userGenres);
            genreScore += userGenreScore;
        }
    });
    genreScore = totalGenreClicks > 0 ? genreScore / totalGenreClicks : 0;

    // Source Score (normalized)
    const { sources: userSources, totalSourceClicks } = userPreferences;
    const sourceScore = getUserPreferenceScore(articleSource, userSources);
    const normalizedSourceScore = totalSourceClicks > 0 ? sourceScore / totalSourceClicks : 0;

    // Combine feature values with weighting
    const genreFeatureValue = genreScore * (weights.GENRE || 1);
    const sourceFeatureValue = normalizedSourceScore * (weights.SOURCE || 1);
    const engagementFactorValue = engagementFactor * (weights.ENGAGEMENT || 1);

    /* 3. Timeliness which i already implement by sorting and scoring more recent articles while leaving older articles
        to be seen when scrolling in the feed.
    */

    /* 4. Damping. I always want to show the user new information. Therefore articles that have already been shown should
        receive a lower score after damping
    */

    // Randomness/exploration factor
    const R_d = Math.random(); // Random score for exploration
    const explorationFactor = lambda * R_d;

    // Final score before nomalization
    const rawScore = genreFeatureValue + sourceFeatureValue + engagementFactorValue + explorationFactor;

    // Final score combining document score with exploration factor
    const finalScore = normalize(rawScore, 0, 1);
    // documentScore + (engagementFactor * weights.ENGAGEMENT) + explorationFactor;
    return Math.min(finalScore, 1);
}


module.exports = {
    articleScore
}