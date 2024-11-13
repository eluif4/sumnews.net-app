<script setup>
import { ref, onMounted, computed, watch, onUnmounted, watchEffect } from 'vue';
import { config } from '../constants';
import { useRoute } from 'vue-router';
import router from '../router';
import DailyRecapItem from '../components/DailyRecap/DailyRecapItem.vue'
import DailyRecapItemSkeleton from '../components/DailyRecap/DailyRecapItemSkeleton.vue';

const BACKEND_URL = config.url.BACKEND_URL;
const route = useRoute();

// Props from route
const dailyrecapUUID = ref(route.params.dailyrecapUUID);
const drEvent = ref(route.params.drEvent);
const visitedDailyRecaps = ref([dailyrecapUUID.value]);

// Watch for changes in the dailyrecapUUID route parameter
watch(() => route.params.dailyrecapUUID, (newUUID, oldUUID) => {
    dailyrecapUUID.value = newUUID;

    // Add dailyrecap to wasVisited array
    if (!visitedDailyRecaps.value.includes(newUUID)) {
        visitedDailyRecaps.value.push(newUUID);
    }

    updateDailyRecapsRef();
});

watch(() => route.params.drEvent, (newDrEvent, oldDrEvent) => {
    drEvent.value = newDrEvent;
});

// State for managing Daily Recaps and the current DailyRecap index
// Computed value for the previous, current, and next daily recaps
const dailyrecaps = ref([]);
// const storedDailyRecaps = ref([]);
const currentDailyRecapIndex = ref(0);
const currentDrEventIndex = ref(0);

// Use watchEffect to set initial value of currentDrEventIndex
// watchEffect(() => {
//     currentDrEventIndex.value = dailyrecaps.value[currentDailyRecapIndex.value]?.drEvents.findIndex(drevent => drevent.id === drEvent.value) || 0;
// });

const fetchDailyRecap = async (dailyrecapUUID) => {
    try {
        const response = await fetch(`${config.url.BACKEND_URL}db/dailyrecap/${dailyrecapUUID}`);

        if (response.ok) {
            const dr = await response.json();
            return dr[0] || null;  // Ensure it always returns an object or null
        } else {
            throw new Error('Failed to fetch Daily Recap');
        }
    } catch (error) {
        console.error('Error fetching events:', error);
        return null;  // Return null in case of an error
    }
}

const updateDailyRecapsRef = async () => {
    dailyrecaps.value = JSON.parse(localStorage.getItem('dailyRecaps')).dailyRecapButtons || [];

    // Find the current recap index from the stored daily recaps
    const currentIndex = dailyrecaps.value.findIndex(recap => recap.id === dailyrecapUUID.value);

    if (currentIndex !== -1) {
        // currentDailyRecapIndex.value = currentIndex;
        // Fetch the previous, current, and next recaps
        const prevRecap = currentIndex > 0 ? await fetchDailyRecap(dailyrecaps.value[currentIndex - 1].id) : null;
        const currentRecap = await fetchDailyRecap(dailyrecaps.value[currentIndex].id);
        const nextRecap = currentIndex < dailyrecaps.value.length - 1 ? await fetchDailyRecap(dailyrecaps.value[currentIndex + 1].id) : null;

        // Update the dailyrecaps array
        dailyrecaps.value = [prevRecap, currentRecap, nextRecap].filter(recap => recap != null);

        // currentDailyRecapIndex can have values of 0, 1, 2 because the dailyrecaps.value array will have a maximum length of 3
        currentDailyRecapIndex.value = dailyrecaps.value.findIndex(dailyrecap => dailyrecap.id == currentRecap.id);
        currentDrEventIndex.value = dailyrecaps.value[currentDailyRecapIndex.value]?.drEvents.findIndex(drevent => drevent.id === drEvent.value) || 0;
    }
}

// Connect carousel positioning to dailyrecaps computed array property
const carouselRef = ref(null);

onMounted(async () => {
    // Wait to updateDailyRecaps ref
    await updateDailyRecapsRef();

    // Connect the carousel value to the dailyrecap in the url
    getCurrentCarouselIndex();

    // Scroll the carousel 'scrollPercentage' amount to match the dailyrecap in the url to the dailyrecap displayed
    // const scrollPercentage = (currentDailyRecapIndex.value) / dailyrecaps.value[currentDailyRecapIndex.value].drEvents.length;

    // dailyrecaps.value is an array with a maximum length of 3
    const scrollPercentage = (currentDailyRecapIndex.value) / 3;
    if (carouselRef.value) {
        carouselRef.value.addEventListener('scroll', handleSlide);
        carouselRef.value.scrollTo({
            left: scrollPercentage * carouselRef.value.scrollWidth,
            behavior: 'instant'
        });
    }
});

const dynamicGap = computed(() => {
    const articleCount = dailyrecaps.value?.currentRecap?.drEvents?.length || 0;
    const maxGap = 10; // Maximum gap in pixels
    const minGap = 3;  // Minimum gap in pixels
    const gap = Math.max(minGap, maxGap - (articleCount - 1));
    return gap;
});

function getCurrentCarouselIndex() {
    if (!carouselRef.value) return 0;

    const scrollPosition = carouselRef.value.scrollLeft;
    const carouselWidth = carouselRef.value.offsetWidth;
    const itemWidth = carouselWidth;

    const index = Math.round(scrollPosition / itemWidth);
    return Math.max(0, Math.min(index, dailyrecaps.value.length));
}

async function handleClick() {
    const screenWidth = window.innerWidth;
    const clickPosition = event.clientX
    if (clickPosition < screenWidth / 2) { // if left
        if (currentDrEventIndex.value != 0)
            currentDrEventIndex.value--;
    } else { // else right
        if (currentDrEventIndex.value != dailyrecaps.value[currentDailyRecapIndex.value].drEvents.length - 1)
            currentDrEventIndex.value++
    }

    router.push({
        name: 'dailyrecap', params: {
            dailyrecapUUID: dailyrecapUUID.value,
            // drUri: dailyrecap.value.drEvents[currentDrEventIndex.value].drUri,
            drEvent: dailyrecaps.value[currentDailyRecapIndex.value].drEvents[currentDrEventIndex.value].id,
        }
    });
}

async function handleSlide() {
    var eventIndex = getCurrentCarouselIndex();

    if (eventIndex != currentDailyRecapIndex.value) { // Reroute only if Daily Recap switched
        currentDailyRecapIndex.value = eventIndex;
        currentDrEventIndex.value = 0;
        router.push({
            name: 'dailyrecap', params: {
                dailyrecapUUID: dailyrecaps.value[eventIndex].id,
                drEvent: dailyrecaps.value[eventIndex].drEvents[0].id,
            }
        });
    }
}

onUnmounted(() => {
    if (carouselRef.value) {
        carouselRef.value.removeEventListener('scroll', handleSlide);
    }
});

function updateWasVisitedDailyRecapButtons() {
    const dailyRecapInLocalStorage = JSON.parse(localStorage.getItem('dailyRecaps'));
    const dailyRecapButtonsArray = dailyRecapInLocalStorage.dailyRecapButtons;
    const lastUpdate = dailyRecapInLocalStorage.lastUpdate;

    // Loop over each visited recap in visitedDailyRecaps array
    visitedDailyRecaps.value.forEach(dailyrecapUUID => {
        const dailyRecapButton = dailyRecapButtonsArray.find(button => button.id === dailyrecapUUID);

        if (dailyRecapButton) {
            // Update wasVisited flag to true
            dailyRecapButton.wasVisited = true;

            // Move this recap button to the end of the array if it's not already there
            // Remove the current recap button from its current position
            const index = dailyRecapButtonsArray.indexOf(dailyRecapButton);
            if (index !== -1) {
                dailyRecapButtonsArray.splice(index, 1);
            }

            // Push it to the end of the array
            dailyRecapButtonsArray.push(dailyRecapButton);
        }
    });

    // Save the updated array into local storage
    localStorage.setItem('dailyRecaps', JSON.stringify({
        "lastUpdate": lastUpdate,
        "dailyRecapButtons": dailyRecapButtonsArray
    }));

    console.log('Visited recaps updated and pushed to the end of the array');

    router.push({
        name: 'home'
    });
}
</script>

<template>
    <div class="dailyrecap-container">
        <!-- HEADER SECTION WITH ALL THE INFORMATION AND BACK BUTTON -->
        <div class="info-header">

            <div class="second count" :style="{ 'gap': dynamicGap + 'px' }">
                <div class="bubble" v-if="dailyrecaps[currentDailyRecapIndex]"
                    v-for="(drEvent, index) in dailyrecaps[currentDailyRecapIndex].drEvents.length" :key="index"
                    :class="{ 'active': index <= currentDrEventIndex }">
                </div>
            </div>

            <div class="first">
                <div class="right" @click="updateWasVisitedDailyRecapButtons">
                    <!-- <router-link to="/"> -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                        <path
                            d="M15.2638 14.4237C15.319 14.4788 15.3627 14.5443 15.3926 14.6164C15.4224 14.6885 15.4378 14.7657 15.4378 14.8437C15.4378 14.9218 15.4224 14.999 15.3926 15.0711C15.3627 15.1432 15.319 15.2087 15.2638 15.2638C15.2086 15.319 15.1431 15.3627 15.0711 15.3926C14.999 15.4225 14.9217 15.4378 14.8437 15.4378C14.7657 15.4378 14.6884 15.4225 14.6164 15.3926C14.5443 15.3627 14.4788 15.319 14.4236 15.2638L9.49996 10.3394L4.57629 15.2638C4.46488 15.3752 4.31377 15.4378 4.15621 15.4378C3.99865 15.4378 3.84755 15.3752 3.73614 15.2638C3.62472 15.1524 3.56213 15.0013 3.56213 14.8437C3.56213 14.6862 3.62472 14.5351 3.73614 14.4237L8.66055 9.49999L3.73614 4.57632C3.62472 4.46491 3.56213 4.3138 3.56213 4.15624C3.56213 3.99868 3.62472 3.84758 3.73614 3.73617C3.84755 3.62475 3.99865 3.56216 4.15621 3.56216C4.31377 3.56216 4.46488 3.62475 4.57629 3.73617L9.49996 8.66058L14.4236 3.73617C14.535 3.62475 14.6862 3.56216 14.8437 3.56216C15.0013 3.56216 15.1524 3.62475 15.2638 3.73617C15.3752 3.84758 15.4378 3.99868 15.4378 4.15624C15.4378 4.3138 15.3752 4.46491 15.2638 4.57632L10.3394 9.49999L15.2638 14.4237Z"
                            fill="white" />
                    </svg>
                    <!-- </router-link> -->
                </div>
            </div>
        </div>

        <!-- EVENTS AND ARTICLES -->
        <div ref="carouselRef" class="dailyrecap-list carousel carousel-center w-full snap-x snap-mandatory">
            <div class="dailyrecap carousel-item w-full snap-center" v-for="(dailyrecap, key) in dailyrecaps"
                :key="dailyrecap.id" v-if="dailyrecaps" @click="handleClick(dailyrecap.id)">

                <DailyRecapItem :dailyrecap="dailyrecap"></DailyRecapItem>
                <!-- <DailyRecapItem :article="drEvent.articles[currentArticleIndex]" :dailyrecap="dailyrecap" /> -->
            </div>
            <div class="dailyrecap" v-else>
                <div class="article-list">
                    <div class="article">
                        <DailyRecapItemSkeleton v-if="!dailyrecaps"></DailyRecapItemSkeleton>
                    </div>
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
    justify-content: flex-end;
    align-items: flex-start;
    gap: 10px;
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

.dailyrecap-list {
    height: 100%;
    scroll-snap-type: x mandatory;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-behavior: smooth;
    background-color: black;
    gap: 20px;
}

.dailyrecap {
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

.left {
    flex: 1;
    white-space: nowrap;
    overflow: overlay;
    text-overflow: ellipsis;
    width: 100%;
}
</style>