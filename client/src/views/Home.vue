<script setup>
import { ref, onMounted } from 'vue'
import {
    front_getArticlesFromDB,
    updateArticleEngagement,
    getAuthToken,
    showPopup
} from '../scripts/utility'
import { List, userProfile, Filter } from '../main'
import { useRoute, useRouter } from 'vue-router';
import { config } from '../constants.js'

const BACKEND_URL = config.url.BACKEND_URL
const route = useRoute();
import Popup from '../components/Popups/Popup.vue'
import Cookies from '../components/Popups/Cookies.vue'
import ArticleSkeleton from '../components/Article/ArticleSkeleton.vue'
import Header from '../components/Page/Header.vue'
import ArticleInstance from '../components/Article/ArticleInstance.vue'
import DailyRecapButton from '../components/DailyRecap/DailyRecapButton.vue';
import DailyRecapButtonSkeleton from '../components/DailyRecap/DailyRecapButtonSkeleton.vue'
import FilterComponent from '../components/Filter/Filter.vue'
import Backdrop from '../components/Article/Backdrop.vue';

var skeletonArticles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
var tempDailyRecapButtons = ref([{}, {}, {}, {}, {}, {}, {}, {}, {}, {}])
var dailyRecapButtons = ref([]);
var hasFetchedDailyRecapFinished = ref(false)

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

    if (scrollPercentage >= 50 && !List.loading) {
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
        else if (route.query.genres?.length > 0 || route.query.sources?.length > 0) {
            const filter = {
                $or: [
                    { "genre": { "$in": route.query.genres ? route.query.params : [] } },
                    { "source": { "$in": route.query.sources ? route.query.sources : [] } }
                ]
            };

            var response = await front_getArticlesFromDB(filter, undefined, undefined, 10 * List.infiniteScrollCallCount, 10)
        }
        // If scrolling in feed
        else {
            if (userProfile.user) {
                var response = await fetch(`${BACKEND_URL}user/feed`, {
                    method: 'POST',
                    headers: {
                        "Content-type": "application/json",
                        "Authorization": `Bearer ${await getAuthToken()}`,
                        "Cache-Control": 'no-store'
                    },
                    body: JSON.stringify({
                        articlesInFeed: List.articles.map(article => article.uuid)
                    })
                });

                // Check if the response is forbidden (status 403)
                if (response.status === 403) {
                    console.error("User isnt logged in");
                    // Handle the forbidden case, e.g., return an error message or redirect the user
                    response = await front_getArticlesFromDB();
                }
                else {
                    var data = await response.json();
                    response = data.articles;
                }
            }
            else {
                response = await front_getArticlesFromDB(undefined, undefined, undefined, 10 * List.infiniteScrollCallCount, 10)
            }
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
        const dailyRecapsInLocalStorage = JSON.parse(localStorage.getItem('dailyRecaps'));

        const dailyRecapsLastUpdate = dailyRecapsInLocalStorage?.lastUpdate ? new Date(dailyRecapsInLocalStorage.lastUpdate) : new Date("01/01/2000");

        // If lastUpdate happened more than 24 hours ago -> Fetch the new dailyRecaps and set the lastUpdate to 18:05 utc
        const needsUpdate = wasUpdatedMoreThan24HoursAgo(dailyRecapsLastUpdate);

        // If there are dailyRecaps in localstorage and it's not past 6 PM the day after lastUpdate
        if (dailyRecapsInLocalStorage && !needsUpdate) {
            dailyRecapButtons.value = dailyRecapsInLocalStorage.dailyRecapButtons;
            hasFetchedDailyRecapFinished.value = true;
        }
        else {
            var response = await fetch(`${BACKEND_URL}db/getDailyRecapButtons`);
            if (!response.status == 200) { // If request isnt successful
                hasFetchedDailyRecapFinished.value = true;
                showPopup(2, 'Sorry, something went wrong with the Daily Recaps. Please try again later');
            } else {
                var dailyRecaps = await response.json();

                // If now is before 1805 UTCC, set lastUpdate to yesterday at 1805 UTC
                // Step 1: Get the current time in UTC
                const now = new Date();

                // Step 2: Create a target time for 18:05 UTC
                const targetTime = new Date();
                targetTime.setUTCHours(18, 5, 0, 0); // Set time to 18:05:00.000 UTC

                // Compare the current time with the target time
                const isBefore1805UTC = now < targetTime;

                var lastUpdate = new Date();

                if (isBefore1805UTC) {
                    const yesterday1805UTC = new Date();
                    yesterday1805UTC.setUTCDate(now.getUTCDate() - 1); // Move the date back by one day
                    yesterday1805UTC.setUTCHours(18, 5, 0, 0); // Set the time to 18:05:00.000 UTC
                    lastUpdate = yesterday1805UTC;
                } else {
                    var UTC1805 = new Date(Date.UTC(
                        new Date().getUTCFullYear(),  // Current year
                        new Date().getUTCMonth(),     // Current month
                        new Date().getUTCDate(),      // Current date
                        18,                           // Hours in UTC (18:05 UTC)
                        5                             // Minutes in UTC
                    ));
                    lastUpdate = UTC1805
                }

                localStorage.setItem('dailyRecaps', JSON.stringify({ "lastUpdate": lastUpdate, "dailyRecapButtons": dailyRecaps }));
                dailyRecapButtons.value = dailyRecaps;
                hasFetchedDailyRecapFinished.value = true;
            }
        }
    } catch (error) {
        console.error(`Failed to fetch Daily Recaps`, error)
    }
}

const wasUpdatedMoreThan24HoursAgo = (lastUpdated) => {
    // Returns a boolean value regarding if lastUpdate happened more then 24 hours ago
    if (!lastUpdated) return true; // If no last updated time is found, consider it as outdated

    const lastUpdatedDate = new Date(lastUpdated);
    const now = new Date();

    // Convert both dates to UTC
    const lastUpdatedUTC = new Date(Date.UTC(
        lastUpdatedDate.getUTCFullYear(),
        lastUpdatedDate.getUTCMonth(),
        lastUpdatedDate.getUTCDate(),
        lastUpdatedDate.getUTCHours(),
        lastUpdatedDate.getUTCMinutes(),
        lastUpdatedDate.getUTCSeconds()
    ));

    const nowUTC = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
    ));

    // Calculate the time difference in milliseconds
    const timeDifference = nowUTC - lastUpdatedUTC;

    // Convert time difference from milliseconds to hours
    const hoursDifference = timeDifference / (1000 * 60 * 60);

    // Check if the difference is 24 hours or more
    return hoursDifference >= 24;
};

const isPremium = ref(true)

onMounted(() => {
    setDailyRecapButtons();
})

// Google One Tap
const callback = (response) => {
    // This callback will be triggered when user click on the One Tap prompt
    // This callback will be also triggered when user click on login button 
    // and selects or login to his Google account from the popup
    // console.log("Handle the response", response)
}
</script>

<template>
    <!-- <GoogleLogin :callback="callback" prompt></GoogleLogin> -->
    <Header />
    <div class="drcontainer">
        <DailyRecapButtonSkeleton v-for="dritem in tempDailyRecapButtons" :dr="dritem"
            v-if="dailyRecapButtons.length === 0 && !hasFetchedDailyRecapFinished" />
        <DailyRecapButton v-for="dritem in dailyRecapButtons" :key="dritem.id" :dr="dritem" v-else />
    </div>
    <div class="app-container"
        :style="dailyRecapButtons.length === 0 ? { height: 'var(--article-stack-nodr-height)' } : {}">
        <div id="article-stack" @scroll="scrollHandler">
            <ArticleSkeleton v-for=" skeleton in skeletonArticles " v-if="List.articles.length == 0">
            </ArticleSkeleton>
            <router-link v-for="( article, index ) in List.articles " :key="article.uuid" style="min-width: 100%"
                :to="{ name: 'article', params: { uuid: article.uuid }, query: { index: index } }">
                <ArticleInstance :article="article" :key="article.uuid" v-if="article.imageUrl"
                    @click="updateArticleEngagement(article, 'clicks')"></ArticleInstance>
            </router-link>
        </div>
    </div>
    <transition name="fade">
        <template v-slot>
            <Backdrop />
        </template>
    </transition>

    <transition name="slideupdown">
        <template v-slot>
            <FilterComponent />
        </template>
    </transition>

    <Cookies></Cookies>
    <Popup></Popup>
    <!-- Google One Tap -->

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

<style scoped>
/* Enter animation */
.slideupdown-enter-from {
    transform: translateY(1000px);
    /* opacity: 0; */
}

.slideupdown-enter-active {
    transition: transform 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940), opacity 0.5s;
}

.slideupdown-enter-to {
    transform: translateY(0);
    /* opacity: 1; */
}

/* Leave animation */
.slideupdown-leave-from {
    transform: translateY(0);
    /* opacity: 1; */
}

.slideupdown-leave-active {
    transition: transform 0.5s cubic-bezier(0.250, 0.460, 0.450, 0.940), opacity 0.5s;
}

.slideupdown-leave-to {
    transform: translateY(1000px);
    /* opacity: 0; */
}
</style>