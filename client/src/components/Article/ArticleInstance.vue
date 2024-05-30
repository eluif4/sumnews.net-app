<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router'
import { config } from '../../constants'
import router from '../../router/index.js';
import { showPopup } from '../../scripts/utility.js';
import ActionItem from '../Action/ActionItem.vue'
import ArticleSwipe from './ArticleSwipe.vue';
// import { actionShareFunction, fullCoverageActionFunction, bookmarkActionFunction } from '../../scripts/utility.js'

const props = defineProps({ article: Object });

const translateX = ref(0);
const startX = ref(0);
const startY = ref(0);
const THRESHOLD = 100;
const MAXIMUMX = 200; // PX FUTURE CHANGE: CHANGE TO PERCENTAGE
const SENSITIVITY = 10;

// ArticleSwipe setup
const swipeAction = ref({})
const showSwipeAction = ref(false);
const swipeDirection = ref('');
const isEventsRoute = ref(false)

const FRONTEND_URL = config.url.FRONTEND_URL
const BACKEND_URL = config.url.BACKEND_URL

const route = useRoute();

// Watch router and design page accordingly
watch(() => route.path, (newPath) => {
    if (newPath.includes('/event/')) {
        isEventsRoute.value = true
    }
    else {
        isEventsRoute.value = false
    }
});

const relativeDate = computed(() => {
    const datePublished = new Date(props.article.datePublished);
    const currentDate = new Date();
    const timeDiff = currentDate - datePublished;
    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) {
        return 'today';
    } else if (minutes < 60) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (days < 30) {
        if (days == 0)
            return 'Today'
        else if (days == 1)
            return 'Yesterday'
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (months < 12) {
        return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
        return `${years} year${years > 1 ? 's' : ''} ago`;
    }
})

// ----- ACTION FUNCTIONS -----
const actionShareFunction = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: `Check out this article on sumnews\n${props.article.title}`,
                text: `I found an interesting article on sumnews from ${props.article.source}.`,
                url: `${FRONTEND_URL}article/${props.article.uuid}`,
            });
        } catch (error) {
            console.error('Error sharing:', error.message);
            // showPopup(2)
        }
    } else {
        if (window.isSecureContext) {
            navigator.clipboard.writeText(`Checkout this article on sumnews\n${FRONTEND_URL}article/${props.article.uuid}`)
            showPopup(1, "Link copied to clipboard succesfully")
        } else {
            showPopup(2, "Oops, something went wrong...")
        }
    }
}

function bookmarkActionFunction() {
    showPopup(1, "Your article has been bookmarked succesfully")
}

function fullCoverageActionFunction() {
    router.push(`/event/${props.article.eventUri}`)
}

// ----- ACTION VARS -----
const shareAction = {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M22 7H14C12.182 7 11.087 7.892 10.68 8.3C10.555 8.427 10.492 8.49 10.49 8.49C10.49 8.492 10.427 8.555 10.3 8.68C9.892 9.087 9 10.182 9 12V15M22 7L17 2M22 7L17 12" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.465 20.535C4.93 22 7.287 22 12.003 22C16.718 22 19.076 22 20.54 20.535C21.782 19.294 21.971 17.412 22 13.998M3.465 20.535C2 19.07 2 16.713 2 11.997M3.465 20.535C4.929 22 7.286 22 12 22C16.714 22 19.071 22 20.535 20.535C21.776 19.295 21.965 17.413 21.995 13.999M3.465 20.535C2 19.071 2 16.714 2 12M3.465 3.46C4.706 2.218 6.588 2.029 10.002 2M2.055 8C2.165 5.807 2.491 4.438 3.465 3.464C4.705 2.224 6.587 2.034 10 2.005" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    actionFunction: actionShareFunction,
}

const bookmarkAction = {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 11.098V16.091C3 19.187 3 20.736 3.734 21.412C4.084 21.735 4.526 21.938 4.997 21.992C5.984 22.105 7.137 21.085 9.442 19.046C10.462 18.145 10.971 17.694 11.56 17.576C11.85 17.516 12.15 17.516 12.44 17.576C13.03 17.694 13.539 18.145 14.558 19.046C16.863 21.085 18.016 22.105 19.003 21.991C19.473 21.938 19.916 21.735 20.266 21.412C21 20.736 21 19.188 21 16.091V11.097C21 6.809 21 4.665 19.682 3.332C18.364 2 16.242 2 12 2C7.757 2 5.636 2 4.318 3.332C3.511 4.148 3.198 5.27 3.077 7M15 6H9" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    actionFunction: bookmarkActionFunction,
}

const fullCoverageAction = {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 14V10C3 6.229 3 4.343 4.172 3.172C5.343 2 7.229 2 11 2H13C16.771 2 18.657 2 19.828 3.172C20.482 3.825 20.771 4.7 20.898 6M21 10V14C21 17.771 21 19.657 19.828 20.828C18.657 22 16.771 22 13 22H11C7.229 22 5.343 22 4.172 20.828C3.518 20.175 3.229 19.3 3.102 18M8 14H13M8 10H9M16 10H12" stroke="${!isEventsRoute.value ? 'white' : '#62febd'}" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    actionFunction: fullCoverageActionFunction,
    strokeColor: isEventsRoute.value ? 'white' : '#62febd'
}

//FUTURE CHANGE: THIS DOESNT WORK
const handleImageError = () => {
    console.log('image couldnt load')
    // props.article.imageUrl = `../assets/icons/sumnews.net.png`
}

// SWIPE TO ACTION
const handleTouchStart = (e) => {
    startX.value = e.touches[0].clientX;
    startY.value = e.touches[0].clientY;
}

const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX.value;
    const deltaY = currentY - startY.value;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > SENSITIVITY) {
        translateX.value = currentX - startX.value;

        // Limit the translation value of MAXIMUMX
        if (translateX.value > MAXIMUMX) {
            translateX.value = MAXIMUMX;
        } else if (translateX.value < -MAXIMUMX) {
            translateX.value = -MAXIMUMX;
        } else {
            translateX.value = currentX - startX.value;
        }

        // Determine swipe direction and show appropriate action
        if (translateX.value > 0) { // CHANGE TO > SENSITIVITY
            swipeAction.value = { color: '#FFA012', svg: shareAction.svg, direction: 'right' }
            swipeDirection.value = 'right';
        } else {
            swipeAction.value = { color: '#FF1212', svg: bookmarkAction.svg, direction: 'left' }
            swipeDirection.value = 'left';
        }

        showSwipeAction.value = true;
    }
}

const handleTouchEnd = (e) => {
    if (Math.abs(translateX.value) > SENSITIVITY) {
        if (translateX.value > THRESHOLD) { // If swipe to the right
            // fullCoverageActionFunction()
            bookmarkActionFunction();
        } else if (translateX.value < -THRESHOLD) {
            actionShareFunction();
        }
    }
    // Reset translateX to 0 after the touch ends
    translateX.value = 0;

    showSwipeAction.value = false
}
</script>

<template>
    <div id="article-instance" class="article-instance" :style="{ transform: `translateX(${translateX}px)` }"
        @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">

        <!-- FUTURE CHANGE: FIX THIS SO THAT ITS BEHIND THE ARTICLE INSTANCE -->
        <ArticleSwipe :action="swipeAction"></ArticleSwipe>

        <img class="article-image" v-if="article.imageUrl" :src="article.imageUrl" alt="Article Image"
            @error="handleImageError">
        <!-- <img class="article-image" v-else src="../assets/icons/sumnews.net.png" alt="Article Image"> -->
        <div class="shader">
            <div class="genre-list">
                <div class="genre" v-for="genre in article.genre" @click="clickGenre(genre)">{{ genre }}</div>
            </div>

            <div class="textual-content">
                <div class="article-title">
                    {{ article.title }}
                </div>
            </div>

            <div class="bottom_row">
                <div class="authorsAndDate">
                    <div class="authors expanded">
                        {{ article.author.length === 0 ? "" : "By: " + article.author.join(', ') }}
                    </div>
                    <div class="source-date">{{ article.source }}, {{ relativeDate }}</div>
                </div>

                <div class="actions">
                    <ActionItem :action="shareAction"></ActionItem>
                    <!-- <ActionItem :action="bookmarkAction"></ActionItem> -->
                    <ActionItem :action="fullCoverageAction" v-if="article.eventUri"></ActionItem>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.article-instance {
    width: 100%;
    min-width: 100%;
    box-shadow: 0px 4px 10px 0px var(--browser-background-color);
    margin: 1% 0 4% 0;
    border-radius: var(--border-radius);
    box-sizing: border-box;

    position: relative;

    display: flex;
    flex-direction: column;
    min-height: 100px;
    /* background-color: var(--main-color); */
    /* transition: transform 1s ease; */
}

.event-page {
    background-color: #62fef7 !important;
}

.article-instance.error {
    background: var(--error-color);
    /* background: linear-gradient(180deg, var(--error-color), #60606033); */
}

.visual-content {
    position: relative;
}

.shader {
    position: absolute;
    height: 100%;
    width: 100%;
    top: 0;
    right: 0;
    background-image: linear-gradient(0deg, rgba(0, 0, 0, 0.75) 10%, rgba(0, 0, 0, 0.2) 80%);
    border-radius: var(--border-radius);
    padding: 10px;

    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-end;
    gap: 5px;
}

.actions {
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-evenly;
    gap: 10px;
    width: fit-content;
    height: fit-content;
    /* position: absolute; */
    /* right: 10px; */
    /* top: 10px; */
    flex-wrap: nowrap;
    /* z-index: 99999; */
}

.article-video {
    width: 100%;
    height: 100%;
    aspect-ratio: 16/ 9;
    border: none;
    border-radius: var(--border-radius);
}

.source-datePublished {
    position: absolute;
    width: fit-content;
    /* margin: 10px; */
    bottom: 0px;
    padding: 10px;
    box-sizing: border-box;
    color: white;
    z-index: 999;
    font-size: 16px;
}

.article-instance.isArticleInstanceOpen {
    word-break: break-word;
}

.article-title {
    font-size: 16px;
    /* font-weight: bold; */
    color: white;
}

.article-title.imageless {
    width: 90%;
}

.textual-content {
    width: 100%;
    /* padding: 5px 10px 5px 10px; */
    position: relative;

    display: flex;
    flex-direction: column;

    box-sizing: border-box;
}

.article-image {
    /* aspect-ratio: 16 / 9; */
    border-radius: var(--border-radius);
    width: 100%;
}

.summarized-content {
    padding: 5px 0;
    font-size: 14px
}

.bottom_row {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: flex-end;
    justify-content: space-between;
    /* padding: 0 10px; */
    /* margin: 10px 0; */
    width: 100%;
}

.genre-list {
    width: 100%;
    display: flex;
    flex-direction: row;
    overflow: auto;
    gap: 10px;
}

.genre {
    width: fit-content;
    color: black;
    background-color: #E5CDC8;
    background: var(--main-color);
    /* background-attachment: fixed; */
    border-radius: 4px;
    padding: 3px 10px;
    box-sizing: border-box;
    white-space: nowrap;
}

.authors {
    opacity: 0 !important;
    color: white;
    font-size: 14px;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.authors.expanded {
    transition: all 2s linear !important;
    opacity: 1 !important;
}

.icon {
    transition: transform var(--transition-time) var(--transition-type)
}

.icon.expanded {
    transform: rotate(180deg);
    bottom: 10px;
}

a {
    color: black;
    text-decoration: none;
}

a.isArticleInstanceOpen {
    color: blue;
    text-decoration: underline !important;
}

.quote {
    background-color: yellow;
    padding: 0 3px;
    border-radius: 4px;
}

.info {
    background-color: #bfbfbf;
    color: #5D90E3;
    padding: 3px;
    border-radius: 4px;
    text-decoration: underline;
}

.source-date {
    color: white;
    font-size: 14px;
    /* opacity: 0.8; */
}
</style>