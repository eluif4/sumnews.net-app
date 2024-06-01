<script setup>
// const props = defineProps({ dailyRecap: Object })
import { ref, onMounted, computed, watch } from 'vue';
import { config } from '../constants';
import router from '../router';
import DailyRecapItem from '../components/DailyRecap/DailyRecapItem.vue'
import DailyRecapItemSkeleton from '../components/DailyRecap/DailyRecapItemSkeleton.vue';
import { front_getArticlesFromDB } from '../scripts/utility';
import { useRoute } from 'vue-router';

const BACKEND_URL = config.url.BACKEND_URL;
const SLIDE_THRESHOLD = 30;
const route = useRoute();

const props = defineProps({
    dailyrecapUUID: String,
    drUri: String,
    articleUUID: String,
});

// FUTURE CHANGE: GET THESE VALUES FROM THE URL
const dailyrecap = ref();
const dailyrecapUUIDRef = ref(props.dailyrecapUUID);
const drUriRef = ref(props.drUri);
const articleUUIDRef = ref(props.articleUUID);
const currentArticle = ref(null) // Current article with relation to the uuid in the URL
const tempDailyRecapSkeleton = ref([{}, {}, {}])

// Scrolling
const startY = ref(0)
const endY = ref(0);

// COMPUTED PROPERTIES
const currentEventIndex = computed(() => {
    return dailyrecap.value?.events.findIndex(event => event.drUri === drUriRef.value);
});

const currentArticleIndex = computed(() => {
    // return dailyrecap.value?.events[currentEventIndex].flatMap(event => event.eventArticles).findIndex(article => article.uuid === articleUUIDRef.value);
    return dailyrecap.value?.events[currentEventIndex.value].eventArticles.findIndex(article => article.uuid === props.articleUUID);
})

// FUNCTIONS
const fetchEventByUri = async (eventUri) => {
    var response = await fetch(`${BACKEND_URL}db/getArticlesFromEvent`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "eventUri": eventUri,
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch event for URI: ${eventUri}`);
    }
    return await response.json();
};

const fetchDrEventBydrUri = async (drUri) => {
    var response = await fetch(`${BACKEND_URL}db/getArticlesFromDrEvent`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "drUri": drUri,
        })
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch event for URI: ${drUri}`);
    }
    return await response.json();
}

// Fetching dailyRecap and event details
const setDailyRecap = async (dailyrecapUUID) => {
    try {
        var response = await fetch(`${BACKEND_URL}db/getDailyRecapById`, {
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
            var tempdailyrecap = await response.json();
            const drEventsPromises = tempdailyrecap.drEvents.map(drUri => fetchDrEventBydrUri(drUri));
            var drEventsObject = await Promise.all(drEventsPromises);
            tempdailyrecap.events = drEventsObject;
            dailyrecap.value = tempdailyrecap;
        } else {
            throw new Error('Failed to fetch Daily Recap');
        }
    } catch (error) {
        console.error('Error fetching events:', error);
    }
};

async function handleClick(event) {
    const screenWidth = window.innerWidth;
    const clickPosition = event.clientX
    var articleIndex = currentArticleIndex.value
    if (clickPosition < screenWidth / 2) { // if left
        if (articleIndex != 0)
            articleIndex--;
    } else { // else right
        if (articleIndex != dailyrecap.value.events[currentEventIndex.value].eventArticles.length - 1)
            articleIndex++
    }

    router.push({
        name: 'dailyrecap', params: {
            dailyrecapUUID: props.dailyrecapUUID,
            drUri: dailyrecap.value.events[currentEventIndex.value].drUri,
            articleUUID: dailyrecap.value.events[currentEventIndex.value].eventArticles[articleIndex].uuid,
        }
    });
}

const handleTouchStart = (event) => {
    startY.value = event.touches[0].clientY;
};

const handleTouchEnd = (event) => {
    endY.value = event.changedTouches[0].clientY;
    handleSlide();
};

async function handleSlide() {
    const deltaY = startY.value - endY.value;
    var eventIndex = currentEventIndex.value;
    if (Math.abs(deltaY) > SLIDE_THRESHOLD) {
        if (deltaY > 0 && eventIndex < dailyrecap.value.events.length - 1) {
            eventIndex++
        } else if (deltaY < 0 && eventIndex > 0) {
            eventIndex--
        }

        drUriRef.value = dailyrecap.value.events[eventIndex].drUri;
        articleUUIDRef.value = dailyrecap.value.events[eventIndex].eventArticles[0].uuid;
        router.push({
            name: 'dailyrecap', params: {
                dailyrecapUUID: props.dailyrecapUUID,
                drUri: drUriRef.value,
                articleUUID: articleUUIDRef.value,
            }
        });
    }
}

onMounted(async () => { // and on route change
    await setDailyRecap(props.dailyrecapUUID);
    // const response = await front_getArticlesFromDB({ uuid: props.articleUUID })
    var article = dailyrecap?.value.events[currentEventIndex.value].eventArticles[currentArticleIndex.value]
    currentArticle.value = article;
});

watch(
    () => route.params.articleUUID,
    async (newuuid) => {
        if (newuuid) {
            var article = dailyrecap?.value.events[currentEventIndex.value].eventArticles[currentArticleIndex.value]
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
</script>

<template>
    <div class="dailyrecap-container" @click="handleClick" @touchstart="handleTouchStart" @touchend="handleTouchEnd"
        v-if="dailyrecap">
        <!-- HEADER SECTION WITH ALL THE INFORMATION AND BACK BUTTON -->
        <div class="info-header">
            <div class="first">
                <div class="left">
                    <p class="title">{{ dailyrecap.source == 'sumnews.net' ? 'Your Daily Recap' : `${dailyrecap.source} Recap`}}</p>
                </div>
                <div class="right">
                    <p class="article-count">{{ currentArticleIndex + 1 }} / {{
            dailyrecap.events[currentEventIndex].eventArticles.length }} Articles
                    </p>
                    <router-link to="/" @click.stop>
                        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                            <path
                                d="M15.2638 14.4237C15.319 14.4788 15.3627 14.5443 15.3926 14.6164C15.4224 14.6885 15.4378 14.7657 15.4378 14.8437C15.4378 14.9218 15.4224 14.999 15.3926 15.0711C15.3627 15.1432 15.319 15.2087 15.2638 15.2638C15.2086 15.319 15.1431 15.3627 15.0711 15.3926C14.999 15.4225 14.9217 15.4378 14.8437 15.4378C14.7657 15.4378 14.6884 15.4225 14.6164 15.3926C14.5443 15.3627 14.4788 15.319 14.4236 15.2638L9.49996 10.3394L4.57629 15.2638C4.46488 15.3752 4.31377 15.4378 4.15621 15.4378C3.99865 15.4378 3.84755 15.3752 3.73614 15.2638C3.62472 15.1524 3.56213 15.0013 3.56213 14.8437C3.56213 14.6862 3.62472 14.5351 3.73614 14.4237L8.66055 9.49999L3.73614 4.57632C3.62472 4.46491 3.56213 4.3138 3.56213 4.15624C3.56213 3.99868 3.62472 3.84758 3.73614 3.73617C3.84755 3.62475 3.99865 3.56216 4.15621 3.56216C4.31377 3.56216 4.46488 3.62475 4.57629 3.73617L9.49996 8.66058L14.4236 3.73617C14.535 3.62475 14.6862 3.56216 14.8437 3.56216C15.0013 3.56216 15.1524 3.62475 15.2638 3.73617C15.3752 3.84758 15.4378 3.99868 15.4378 4.15624C15.4378 4.3138 15.3752 4.46491 15.2638 4.57632L10.3394 9.49999L15.2638 14.4237Z"
                                fill="white" />
                        </svg>
                    </router-link>
                </div>
            </div>
            <div class="second count">
                <div class="bubble count"
                    v-for="(_, index) in dailyrecap.events[currentEventIndex].eventArticles.length"
                    :class="{ 'active': index <= currentArticleIndex }">
                </div>
            </div>
        </div>

        <!-- EVENTS AND ARTICLES -->
        <div class="event-list">
            <div class="event" v-for="(event, index) in dailyrecap.events" :key="event.drUri">
                <!-- {{ event.eventArticles.length }} -->
                <div class="article-list">
                    <div class="article" v-for="eventArticle in dailyrecap.events[currentEventIndex].eventArticles"
                        :key="eventArticle.id" v-if="currentArticle">
                        <!-- FUTURE CHANGE: WHILE THE REQUESTS LOAD PLACE SKELETONS -->
                        <DailyRecapItemSkeleton v-if="!dailyrecap"></DailyRecapItemSkeleton>
                        <DailyRecapItem :article="currentArticle" v-else-if="currentArticle.uuid == articleUUIDRef">
                        </DailyRecapItem>
                        <!-- <DailyRecapItem :article="eventArticle" v-else></DailyRecapItem> -->
                    </div>
                </div>
                <!-- <DailyRecapItem v-else :article="event.eventArticles[0]"></DailyRecapItem> -->
            </div>
        </div>

        <!-- FOOTER SECTION -->
        <!-- <div class="myfooter">
            <div class="count-container" v-if="dailyrecap">
                <p class="event-count">{{ currentEventIndex + 1 }} / {{ dailyrecap.events.length }} Events</p>
            </div>
            <div class="bubble-container count" v-if="dailyrecap">
                <div class="event-counter bubble" v-for="(event, index) in dailyrecap.events"
                    :class="{ 'active': index <= currentEventIndex }"></div>
            </div>
        </div> -->
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

.second {}

.bubble {
    width: 100%;
    background-color: white;
    border-radius: 4px;
    height: 10px;
}

.event-list {
    width: 100%;
    height: 100%;
    /* overflow-y: auto; */
    overflow-y: hidden;
    overflow-x: hidden;
}

.event {
    height: 100%;
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    margin-bottom: 20px;
    background: #404040;
    border-radius: 25px 25px 0 0 ;
    box-shadow: 0 4px 20px 0 #000000;
}

.article-list {
    height: 100%;
    overflow-y: hidden;
    overflow-x: auto;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
}

.article {
    height: 100%;
    width: 100vh;
}

.myfooter {
    position: absolute;
    bottom: 0;
    left: 0;

    width: 100%;
    height: calc(8% - 20px);
    z-index: 100;
    background: linear-gradient(0deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%);

    border-radius: 25px 25px 0 0;
    padding: 10px;

    color: white;

    display: flex;
    flex-direction: column;
    justify-content: space-between;
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
    gap: 10px
}

.event-count {
    text-align: right;
    font-size: 16px;
}

.active {
    background-color: var(--main-color) !important;
}
</style>