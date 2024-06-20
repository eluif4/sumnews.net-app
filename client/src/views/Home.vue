<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { front_getArticlesFromDB } from '../scripts/utility'
import { List } from '../main'
import { useRoute } from 'vue-router';
import { config } from '../constants.js'

const BACKEND_URL = config.url.BACKEND_URL
const route = useRoute();

import SumnewsLogo from '../assets/icons/sumnews.net.png'

import Popup from '../components/Popups/Popup.vue'
import Cookies from '../components/Popups/Cookies.vue'
import ArticleSkeleton from '../components/Article/ArticleSkeleton.vue'
import Header from '../components/Page/Header.vue'
import ArticleInstance from '../components/Article/ArticleInstance.vue'
import DailyRecapButton from '../components/DailyRecap/DailyRecapButton.vue';
import DailyRecapButtonSkeleton from '../components/DailyRecap/DailyRecapButtonSkeleton.vue'

var skeletonArticles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
var tempDailyRecapButtons = ref([{}, {}, {}, {}, {}, {}, {}, {}, {}, {}])
var dailyRecapButtons = ref([]);

function existsInFeed(insertArticle) {
    for (const article of List.articles) { // Loop over articles in dom (feed)
        if (article.uuid == insertArticle.uuid)
            return true
    }
    return false
}

async function scrollHandler(event) {
    // Total amount of scrolling - Client screen height
    const scollableHeight = event.target.scrollHeight - event.target.clientHeight
    const scrollPercentage = (event.target.scrollTop / scollableHeight) * 100

    if (scrollPercentage >= 70 && !List.loading) {
        List.loading = true
        List.infiniteScrollCallCount++;
        var articlesToAdd = [];
        // If scrolling for events
        if (route.path.includes('/event/')) {
            const filter = {
                "eventUri": route.params.eventUri
            }
            var response = await front_getArticlesFromDB(filter, undefined, undefined, 10 * List.infiniteScrollCallCount, 10)
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

            articlesToAdd = await response.json()
            articlesToAdd = response.filter(article => !existsInFeed(article));
        }
        // Infinite scrolling if Filtering articles
        else if (JSON.parse(localStorage.getItem('genres')).length > 0 || JSON.parse(localStorage.getItem('sources')).length > 0) {
            const filter = {
                $or: [
                    { "genre": { "$in": JSON.parse(localStorage.getItem('genres')) } },
                    { "source": { "$in": JSON.parse(localStorage.getItem('sources')) } }
                ]
            };

            var response = await front_getArticlesFromDB(filter, undefined, undefined, 10 * List.infiniteScrollCallCount, 10)
        }
        // If scrolling in feed
        else {
            const filter = {}
            var response = await front_getArticlesFromDB(filter, undefined, undefined, 10 * List.infiniteScrollCallCount, 10)
        }
        articlesToAdd = response.filter(article => !existsInFeed(article));
        List.articles = List.articles.concat(articlesToAdd)
        List.loading = false
    }
    // }
}

async function setDailyRecapButtons() {
    try {
        // Gets most recent daily recaps
        var response = await fetch(`${BACKEND_URL}db/getDailyRecaps`)
        // For every source call a get source endpoint and get the source logo. Place it in the dailyrecap object
        var dailyRecaps = await response.json()
        const dailyrecapsSources = dailyRecaps.map(dailyrecap => dailyrecap.source);
        var response = await fetch(`${BACKEND_URL}db/getSourcesLogo`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sources: dailyrecapsSources
            })
        })
        var sourceLogos = await response.json();
        for (const [index, dailyrecap] of dailyRecaps.entries()) {
            if (dailyrecap.source === 'sumnews.net') {
                dailyrecap.sourceLogo = SumnewsLogo;
            }
            else
                dailyrecap.sourceLogo = sourceLogos[index].logo
        }

        dailyRecapButtons.value = dailyRecaps;
    } catch (error) {
        console.error(`Failed to fetch Daily Recaps`)
    }
}

const isPremium = ref(true)

onMounted(() => {
    setDailyRecapButtons();
})
</script>

<template>
    <Header />
    <div class="drcontainer">
        <DailyRecapButtonSkeleton v-for="dritem in tempDailyRecapButtons" :dr="dritem" v-if="!dailyRecapButtons" />
        <DailyRecapButton v-for="dritem in dailyRecapButtons" :key="dritem.id" :dr="dritem" v-else />
    </div>
    <div class="app-container"
        :style="dailyRecapButtons.length === 0 ? { height: 'var(--article-stack-nodr-height)' } : {}">
        <div id="article-stack" @scroll="scrollHandler">
            <ArticleSkeleton v-for=" skeleton  in  skeletonArticles " v-if="List.articles.length == 0">
            </ArticleSkeleton>
            <router-link v-for="( article, index ) in  List.articles " :key="article.uuid" style="min-width: 100%"
                :to="{ name: 'article', params: { uuid: article.uuid }, query: { index: index } }">
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
    height: calc(var(--article-stack-height));
}

#article-stack {
    height: 100%;
    margin: auto;
    width: 100%;

    overflow-y: auto;
    padding: 0 2% 30px 2%;
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
    margin: 10px 0;
    padding: 0 10px;
    width: 100vw;
    overflow-x: auto;
    overflow-y: hidden;
    display: flex;
    flex-direction: row;
    gap: 20px;
    flex-wrap: nowrap;
    align-items: center;
    box-sizing: border-box;
    -ms-overflow-style: none;
    /* IE and Edge */
    scrollbar-width: none;
    /* Firefox */
}

.drcontainer::-webkit-scrollbar {
    display: none;
}
</style>