function articleScore(article, userPreferences, weights) {
    const { genre: articleGenres, source: articleSource } = article;
    const { genres: userGenres, sources: userSources, totalGenreClicks, totalSourceClicks } = userPreferences;

    const k = weights.SMOOTHNESS; // Constant for smoothness
    const lambda = weights.EXPLORATION || 0.1; // Weight for exploration, default to 0.1 if not provided

    // Helper function to get user preference score for a property
    const getUserPreferenceScore = (property, userPreferences) => {
        return userPreferences.find(p => p.name.toLowerCase() === property.toLowerCase())?.clicks || 0;
    };

    // Calculate genre score
    let genreScore = 0;
    articleGenres.forEach(genre => {
        const userGenreScore = getUserPreferenceScore(genre, userGenres);
        genreScore += userGenreScore;
    });
    genreScore = totalGenreClicks > 0 ? genreScore / totalGenreClicks : 0;

    // Calculate source score
    const sourceScore = getUserPreferenceScore(articleSource, userSources);
    const normalizedSourceScore = totalSourceClicks > 0 ? sourceScore / totalSourceClicks : 0;

    // Feature value for document
    const genreFeatureValue = genreScore * (weights.GENRE || 1);
    const sourceFeatureValue = normalizedSourceScore * (weights.SOURCE || 1);
    

    // Combine feature values
    const documentScore = genreFeatureValue + sourceFeatureValue;

    // Randomness/exploration factor
    const R_d = Math.random(); // Random score for exploration
    const explorationFactor = lambda * R_d;

    // Final score combining document score with exploration factor
    const finalScore = documentScore + explorationFactor;

    return finalScore;
}


module.exports = {
    articleScore
}