const { postArticleToInstagram } = require('../../2-utils/api/instagram-graphi-api');
const { getArticlesFromDB } = require('../../2-utils/db/databaseAccess')

async function postArticleToInstagramController(req, res) {
    const uuid = req.body.articleUUID
    const googleId = req.user.googleId;

    if (googleId == '112280303368541696842') {
        var mongooseArticle = await getArticlesFromDB({ uuid: uuid })
        var article = mongooseArticle[0].toObject();
        const response = await postArticleToInstagram(article);

        if (response == null) {
            throw new Error('Failed in controller');
        } else {
            res.send({ status: 200, message: 'Post Successfully Uploaded' });
        }
    } else {
        res.send({ status: 403, message: 'Unauthorized route' })
    }
}

module.exports = {
    postArticleToInstagramController
}