<script setup>
import { ref } from 'vue'
import { front_getArticlesFromDB } from '../scripts/utility'
import { List } from '../main'
import { useRoute } from 'vue-router';
import CNNLogo from '@/assets/icons/cnn.png'
import bgsumnewslogo from '@/assets/icons/bgsumnewslogo.png';
import NYPLogo from '@/assets/icons/nyp.png';
import ForbesLogo from '@/assets/icons/forbes.png';
import BILogo from '@/assets/icons/businessinsider.png';
import YahooNewsLogo from '@/assets/icons/yahoonews.png';

const route = useRoute();

import Popup from '../components/Popups/Popup.vue'
import Cookies from '../components/Popups/Cookies.vue'
import ArticleSkeleton from '../components/Article/ArticleSkeleton.vue'
import Header from '../components/Page/Header.vue'
import Filter from '../components/Filter/Filter.vue'
import ArticleContent from '../components/Article/ArticleContent.vue'
import ArticleInstance from '../components/Article/ArticleInstance.vue'
import DailyRecapButton from '../components/DailyRecap/DailyRecapButton.vue'

var skeletonArticles = [1, 2, 3, 4, 5, 6]

// if (List.articles.length == 0) {
if (route.path.includes('/event/')) {
    front_getArticlesFromDB(
        { "eventUri": route.params.eventUri },
        undefined,
        undefined,
        10 * List.infiniteScrollCallCount,
        10)
        .then(response => {
            let articlesToAdd = response.filter(article => !existsInFeed(article));
            List.articles = List.articles.concat(articlesToAdd);
            List.loading = false;
        })
}
// } else {
//     front_getArticlesFromDB()
//         .then(response => {
//             const articles = response.data
//             for (const article of articles) {
//                 if (!existsInFeed(article))
//                     List.articles.push(article)
//             }
//         })
// }
// }

function existsInFeed(insertArticle) {
    for (const article of List.articles) { // Loop over articles in dom (feed)
        if (article.uuid == insertArticle.uuid)
            return true
    }
    return false
}

async function scrollHandler(event) {
    // if (List.articles[List.articles.length - 1].genre[0] != errorGenre[0]) {
    // Total amount of scrolling - Client screen height
    const scollableHeight = event.target.scrollHeight - event.target.clientHeight
    const scrollPercentage = (event.target.scrollTop / scollableHeight) * 100

    if (scrollPercentage >= 70 && !List.loading) {
        List.loading = true
        List.infiniteScrollCallCount++;
        // If scrolling for events
        if (route.path.includes('/event/')) {
            front_getArticlesFromDB(
                { "eventUri": route.params.eventUri },
                undefined,
                undefined,
                10 * List.infiniteScrollCallCount,
                10)
                .then(response => {
                    let articlesToAdd = response.filter(article => !existsInFeed(article));
                    List.articles = List.articles.concat(articlesToAdd);
                    List.loading = false;
                })
        }
        else if (route.path.includes('/search')) {
            const response = await fetch(`${BACKEND_URL}db/search?search_query=${route.query.searchQuery}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    infiniteScrollCallCount: List.infiniteScrollCallCount
                })
            })

            let articlesToAdd = await response.json()
            articlesToAdd = response.filter(article => !existsInFeed(article));
            List.articles = List.articles.concat(articlesToAdd);
            List.loading = false;
        }
        // If scrolling in feed
        else {
            front_getArticlesFromDB(
                { "source": List.filterType.source, "genre": List.filterType.genre, "search": List.filterType.searchQuery },
                undefined,
                undefined,
                // undefined,
                10 * List.infiniteScrollCallCount,
                10)
                .then(response => {
                    let articlesToAdd = response.filter(article => !existsInFeed(article));
                    List.articles = List.articles.concat(articlesToAdd)
                    List.loading = false
                })
        }
    }
    // }
}

const drsumnews = {
    source: "Sumnews",
    sourceLogo: bgsumnewslogo,
    dailyRecapId: '1908cae5-e65e-4cba-8fee-ed4b14d41d65',
}

const drcnn = {
    source: "CNN",
    sourceLogo: CNNLogo,
    dailyRecapId: 2
}

const drnyt = {
    source: "New York Times",
    sourceLogo: NYPLogo,
    dailyRecapId: 3
}

const drforbes = {
    source: "Forbes",
    sourceLogo: ForbesLogo,
    dailyRecapId: 4
}

const dryahoonews = {
    source: "Yahoo News",
    sourceLogo: YahooNewsLogo,
    dailyRecapId: 5
}

const drbi = {
    source: "Business Insider",
    sourceLogo: BILogo,
    dailyRecapId: 6
}

const drarray = [drsumnews, drcnn, drnyt, drforbes, dryahoonews, drbi]

const isPremium = ref(true)

</script>

<template>
    <Header />
    <div class="drcontainer" v-if="isPremium">
        <DailyRecapButton v-for="dritem in drarray" :key="dritem.dailyRecapId" :dr="dritem" />
    </div>
    <div class="app-container">
        <div id="article-stack" @scroll="scrollHandler">
            <ArticleSkeleton v-for="skeleton in skeletonArticles" v-if="List.articles.length == 0"></ArticleSkeleton>
            <router-link v-for="(article) in List.articles" :key="article.uuid"
                :to="{ name: 'article', params: { uuid: article.uuid } }">
                <ArticleInstance :article="article" :key="article.uuid" v-if="article.imageUrl"></ArticleInstance>
            </router-link>
        </div>
        <Cookies></Cookies>
    </div>
    <Popup></Popup>
</template>

<style>
.app-container {
    width: 100%;
    background-color: transparent;
    position: absolute;
    z-index: 50;
    height: calc(100% - var(--dropdown-height));
}

#article-stack {
    height: 100%;
    margin: auto;
    width: 100%;

    overflow-y: auto;
    padding: 10px 2% 10px 2%;
    box-sizing: border-box;

    -ms-overflow-style: none;
    scrollbar-width: none;

    display: flex;
    flex-direction: column;
    align-items: center;
}

/* SCROLLBARY STYLING */
#article-stack::-webkit-scrollbar {
    display: none;
}

.drcontainer {
    padding: 4px 10px;
    width: 100vw;
    overflow-x: auto;
    overflow-y: hidden;
    display: flex;
    flex-direction: row;
    gap: 20px;
    flex-wrap: nowrap;
    align-items: center;
    box-sizing: border-box;
}

.drcontainer {
    -ms-overflow-style: none;
    /* IE and Edge */
    scrollbar-width: none;
    /* Firefox */
}

.drcontainer::-webkit-scrollbar {
    display: none;
}
</style>