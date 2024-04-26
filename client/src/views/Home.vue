<script setup>
import { front_getArticlesFromDB } from '../scripts/utility'
import { List } from '../main'
import { useRoute } from 'vue-router';

const route = useRoute();

import Popup from '../components/Popups/Popup.vue'
import Cookies from '../components/Popups/Cookies.vue'
import ArticleSkeleton from '../components/Article/ArticleSkeleton.vue'
import Header from '../components/Page/Header.vue'
import Filter from '../components/Filter/Filter.vue'
import ArticleContent from '../components/Article/ArticleContent.vue'
import ArticleInstance from '../components/Article/ArticleInstance.vue'

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
            let articlesToAdd = response.data.filter(article => !existsInFeed(article));
            List.articles = List.articles.concat(articlesToAdd);
            List.loading = false;
        })
} else {
    front_getArticlesFromDB()
        .then(response => {
            const articles = response.data
            for (const article of articles) {
                if (!existsInFeed(article))
                    List.articles.push(article)
            }
        })
}
// }

function existsInFeed(insertArticle) {
    for (const article of List.articles) { // Loop over articles in dom (feed)
        if (article.uuid == insertArticle.uuid)
            return true
    }
    return false
}

function scrollHandler(event) {
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
                    let articlesToAdd = response.data.filter(article => !existsInFeed(article));
                    List.articles = List.articles.concat(articlesToAdd);
                    List.loading = false;
                })
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
                    let articlesToAdd = response.data.filter(article => !existsInFeed(article));
                    List.articles = List.articles.concat(articlesToAdd)
                    List.loading = false
                })
        }
    }
    // }
}

// FUTURE CHANGE: i dont think i need this anymore because i dont need to open and close specific articles
// const setArticleRef = (el, index) => {
//     if (el) {
//         articleRefs.value[index] = el
//     }
// }

// FUTURE CHANGE: i dont think i need this anymore because i dont need to open and close specific articles
// onMounted(() => {
//     if (route.path.includes('/article/')) {
//         handleToggleState(0)
//     }
// })

// const isEventPage = ref(route.path.includes('/event/'));

// watch(() => route.path, (newPath) => {
//     isEventPage.value = newPath.includes('/event/');
//     document.getElementById('article-stack').scrollTop = 0;
// });
</script>

<template>
    <Header />
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
</style>