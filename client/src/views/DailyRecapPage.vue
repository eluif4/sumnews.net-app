<script setup>
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import { config } from '../constants';
import { useRoute } from 'vue-router';
import router from '../router';
import DailyRecapItem from '../components/DailyRecap/DailyRecapItem.vue'
import DailyRecapItemSkeleton from '../components/DailyRecap/DailyRecapItemSkeleton.vue';

const BACKEND_URL = config.url.BACKEND_URL;
const route = useRoute();
const currentEventIndex = ref(0);
const currentArticleIndex = ref(0);

const props = defineProps({
    dailyrecapUUID: String,
    drUri: String,
    articleUUID: String,
});

const dailyrecap = ref();
const drUriRef = ref(props.drUri);
const articleUUIDRef = ref(props.articleUUID);
const currentArticle = ref(null) // Current article with relation to the uuid in the URL

const dynamicGap = computed(() => {
    const articleCount = dailyrecap.value?.drEvents[currentEventIndex.value].articles.length;
    const maxGap = 10; // Maximum gap in pixels
    const minGap = 3;  // Minimum gap in pixels
    const gap = Math.max(minGap, maxGap - (articleCount - 1));
    return gap
});

// Scrolling
const startX = ref(0)
const endX = ref(0);

const carouselRef = ref(null);

function getCurrentCarouselIndex() {
    if (!carouselRef.value) return 0;

    const scrollPosition = carouselRef.value.scrollLeft;
    const carouselWidth = carouselRef.value.offsetWidth;
    const itemWidth = carouselWidth;

    const index = Math.round(scrollPosition / itemWidth);
    return Math.max(0, Math.min(index, dailyrecap.value?.drEvents.length));
}

// Fetch dailyrecap item
const setDailyRecap = async (dailyrecapUUID) => {
    try {
        var response = await fetch(`${BACKEND_URL}db/getDailyRecaps`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "uuid": dailyrecapUUID
            })
        });

        if (response.ok) {
            var dr = await response.json();
            dailyrecap.value = dr;
        } else {
            throw new Error('Failed to fetch Daily Recap');
        }
    } catch (error) {
        console.error('Error fetching events:', error);
    }
};

async function handleClick() {
    const screenWidth = window.innerWidth;
    const clickPosition = event.clientX
    if (clickPosition < screenWidth / 2) { // if left
        if (currentArticleIndex.value != 0)
            currentArticleIndex.value--;
    } else { // else right
        if (currentArticleIndex.value != dailyrecap.value.drEvents[currentEventIndex.value].articles.length - 1)
            currentArticleIndex.value++
    }

    router.push({
        name: 'dailyrecap', params: {
            dailyrecapUUID: props.dailyrecapUUID,
            drUri: dailyrecap.value.drEvents[currentEventIndex.value].drUri,
            articleUUID: dailyrecap.value.drEvents[currentEventIndex.value].articles[currentArticleIndex.value].uuid,
        }
    });
}

async function handleSlide() {
    var eventIndex = getCurrentCarouselIndex();
    currentEventIndex.value = dailyrecap.value?.drEvents.findIndex(event => event.drUri === drUriRef.value);

    if (eventIndex != currentEventIndex.value) { // Reroute only if event switched
        drUriRef.value = dailyrecap.value.drEvents[eventIndex].drUri;
        articleUUIDRef.value = dailyrecap.value.drEvents[eventIndex].articles[0].uuid;
        router.push({
            name: 'dailyrecap', params: {
                dailyrecapUUID: props.dailyrecapUUID,
                drUri: drUriRef.value,
                articleUUID: articleUUIDRef.value,
            }
        });
    }
}

onMounted(async () => {
    await setDailyRecap(props.dailyrecapUUID);

    // Calculate 'currentEventIndex'
    try {
        currentEventIndex.value = dailyrecap.value?.drEvents.findIndex(event => event.drUri === drUriRef.value);
    } catch (err) {
        console.log(`FAILED to connect carousel position to event counter`, err);
    }

    // Calculate 'currentArticleIndex'
    try {
        currentArticleIndex.value = dailyrecap.value?.drEvents[currentEventIndex.value].articles.findIndex(article => article.uuid === props.articleUUID);
    } catch (err) {
        console.log(`FAILED to connect article to uuid in link`, err);
    }

    // Sync 'carouselRef' and scroll position to event in dailyrecap
    const scrollPercentage = (currentEventIndex.value) / dailyrecap.value?.drEvents.length
    if (carouselRef.value) {
        carouselRef.value.addEventListener('scroll', handleSlide);
        carouselRef.value.scrollTo({
            left: scrollPercentage * carouselRef.value.scrollWidth,
            behavior: 'instant'
        });
    }

    var article = dailyrecap?.value.drEvents[currentEventIndex.value].articles[currentArticleIndex.value]
    currentArticle.value = article;
});

onUnmounted(() => {
    if (carouselRef.value) {
        carouselRef.value.removeEventListener('scroll', handleSlide);
    }
});

watch(
    () => route.params.articleUUID,
    async (newuuid) => {
        if (newuuid) {
            var article = dailyrecap?.value.drEvents[currentEventIndex.value].articles[currentArticleIndex.value]
            if (article) {
                // Setup inital dailyrecap values
                drUriRef.value = route.params.drUri;
                articleUUIDRef.value = route.params.articleUUID;
                currentArticle.value = article;
            } else {
                route.push('/error')
            }
        }
    })

watch(() => route.params.drUri, (newDrUri, oldDrUri) => {
    currentArticleIndex.value = 0;
})
</script>

<template>
    <div class="dailyrecap-container">
        <!-- HEADER SECTION WITH ALL THE INFORMATION AND BACK BUTTON -->
        <div class="info-header">
            <div class="first">
                <div class="left">
                    <p class="title" v-if="dailyrecap">{{ dailyrecap.source == 'sumnews.net' ? 'Your Daily Recap' :
                        `${dailyrecap.source}'s Daily Recap` }}</p>
                    <p class="title skeleton h-4 w-48" v-else></p>
                </div>
                <div class="right">
                    <p class="article-count" v-if="dailyrecap">{{ currentArticleIndex + 1 }} / {{
                        dailyrecap.drEvents[currentEventIndex].articles.length }} Articles
                    </p>
                    <p class="article-count skeleton h-4 w-16" v-else></p>
                    <router-link to="/">
                        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                            <path
                                d="M15.2638 14.4237C15.319 14.4788 15.3627 14.5443 15.3926 14.6164C15.4224 14.6885 15.4378 14.7657 15.4378 14.8437C15.4378 14.9218 15.4224 14.999 15.3926 15.0711C15.3627 15.1432 15.319 15.2087 15.2638 15.2638C15.2086 15.319 15.1431 15.3627 15.0711 15.3926C14.999 15.4225 14.9217 15.4378 14.8437 15.4378C14.7657 15.4378 14.6884 15.4225 14.6164 15.3926C14.5443 15.3627 14.4788 15.319 14.4236 15.2638L9.49996 10.3394L4.57629 15.2638C4.46488 15.3752 4.31377 15.4378 4.15621 15.4378C3.99865 15.4378 3.84755 15.3752 3.73614 15.2638C3.62472 15.1524 3.56213 15.0013 3.56213 14.8437C3.56213 14.6862 3.62472 14.5351 3.73614 14.4237L8.66055 9.49999L3.73614 4.57632C3.62472 4.46491 3.56213 4.3138 3.56213 4.15624C3.56213 3.99868 3.62472 3.84758 3.73614 3.73617C3.84755 3.62475 3.99865 3.56216 4.15621 3.56216C4.31377 3.56216 4.46488 3.62475 4.57629 3.73617L9.49996 8.66058L14.4236 3.73617C14.535 3.62475 14.6862 3.56216 14.8437 3.56216C15.0013 3.56216 15.1524 3.62475 15.2638 3.73617C15.3752 3.84758 15.4378 3.99868 15.4378 4.15624C15.4378 4.3138 15.3752 4.46491 15.2638 4.57632L10.3394 9.49999L15.2638 14.4237Z"
                                fill="white" />
                        </svg>
                    </router-link>
                </div>
            </div>
            <div class="second count" :style="{ 'gap': dynamicGap + 'px' }">
                <div class="bubble" v-for="(_, index) in dailyrecap.drEvents[currentEventIndex].articles.length"
                    :key="index" :class="{ 'active': index <= currentArticleIndex }" v-if="dailyrecap">
                </div>
            </div>
        </div>

        <!-- EVENTS AND ARTICLES -->
        <div ref="carouselRef" class="event-list carousel carousel-center rounded-box w-full snap-x snap-mandatory">
            <div class="event carousel-item w-full snap-center" v-for="(drEvent, index) in dailyrecap.drEvents"
                :key="drEvent.drUri" v-if="dailyrecap" @click="handleClick()">
                <DailyRecapItem :article="drEvent.articles[currentArticleIndex]" :dailyrecap="dailyrecap" />
            </div>
            <div class="event" v-else>
                <div class="article-list">
                    <div class="article">
                        <DailyRecapItemSkeleton v-if="!dailyrecap"></DailyRecapItemSkeleton>
                    </div>
                </div>
            </div>
        </div>

        <!-- FOOTER SECTION -->
        <div class="myfooter">
            <div class="count-container">
                <p class="event-count" v-if="dailyrecap">{{ currentEventIndex + 1 }} / {{ dailyrecap.drEvents.length }}
                    Events</p>
                <p class="event-count skeleton h-4 w-32" v-else></p>
            </div>
            <div class="bubble-container" v-if="dailyrecap">
                <div class="event-counter dot" v-for="(event, index) in dailyrecap.drEvents"
                    :class="{ 'active-dot': index == currentEventIndex }">
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dailyrecap-container {
    height: 100%;
    width: 100%;
}

.info-header {
    width: 100%;
    height: 100px;
    box-sizing: border-box;
    position: absolute;
    z-index: 2;
    top: 0;
    left: 0;
    padding: 10px;

    color: white;
    background: rgb(0, 0, 0);
    background: linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 90%);

    display: flex;
    flex-direction: column;
    gap: 10px;
}

.first {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
}

.right {
    display: flex;
    align-items: center;
    flex-direction: row;
    gap: 10px;
}

.bubble {
    width: 100%;
    background-color: white;
    border-radius: 4px;
    height: 6px;
}

.event-list {
    height: 100%;
    scroll-snap-type: x mandatory;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    background-color: black;
    gap: 20px;
}

.event {
    height: 100%;
    width: 100%;
    scroll-snap-align: center;
    flex: 0 0 100%;
    display: flex;
    flex-direction: column;
    overflow-y: hidden;
    margin-bottom: 20px;
    background: #404040;
    border-radius: 25px 25px 0 0;
    box-shadow: 0 4px 20px 0 #000000;
}

.active {
    transform: translateX(0);
}

.article-list {
    height: 100%;
    width: 100%;
    overflow-y: hidden;
    overflow-x: auto;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
}

.article {
    height: 100%;
    width: 100%;
}

.myfooter {
    position: absolute;
    bottom: 0;
    /* left: 0; */

    width: 100%;
    height: 70px;
    z-index: 100;
    background: linear-gradient(0deg, rgba(0, 0, 0, 1) 0%, rgb(64, 64, 64, 0) 100%);

    padding: 10px;

    color: white;

    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    backdrop-filter: blur(4px);
    align-items: center;
}

.count {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    transition: background-color 0.3s ease;
}

.footer-container {
    display: flex;
    flex-direction: column;
}

.bubble-container {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 10px
}

.event-count {
    text-align: center;
    font-size: 16px;
}

.active {
    background-color: var(--main-color) !important;
}

.dot {
    width: 10px;
    height: 10px;
    background-color: white;
    border-radius: 20px;
}

.active-dot {
    width: 20px;
    height: 20px;
    border: 2px solid black;
    background-color: var(--main-color);
}

.skeleton {
    background-color: #e5e6e6;
}
</style>