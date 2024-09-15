<script setup>
import { ref, computed, watch } from 'vue';;
import { useRoute } from 'vue-router';
import { config } from '../../constants';
import {
    shareAction,
    fullCoverageAction,
    dailyRecapAction,
    bookmarkAction,
    removeBookmarkAction
} from '../../scripts/actions';
import { OPEN_ORIGINAL_ARTICLE_SWIPE_ACTION, FULL_COVERAGE_SWIPE_ACTION } from '../../scripts/swipeActions';
import ActionItem from '../Action/ActionItem.vue';
import ArticleSwipe from './ArticleSwipe.vue';
import errorImage from '../../assets/icons/sumnews.net_banner.png'
import { userProfile } from '../../main';


const props = defineProps({ article: Object });
const articleRef = ref(props.article || {})
const FRONTEND_URL = config.url.FRONTEND_URL
const BACKEND_URL = config.url.BACKEND_URL

const swipeStarted = ref(false);
const translateX = ref(0);
const startX = ref(0);
const startY = ref(0);
const hasTouchEnded = ref(false);
const THRESHOLD = 80;
const MAXIMUMX = 200;
const SENSITIVITY = 10;
// const XSENSITIVITY = 5;

// Check if article image is valid
function isValidImageUrl(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
}

async function checkAndReplaceImageUrl() {
    const isValid = await isValidImageUrl(articleRef.value.imageUrl);
    if (!isValid) {
        articleRef.value.imageUrl = errorImage;
    }
}

checkAndReplaceImageUrl(); // Call the function to check and replace the imageUrl

// Creating an object of the users actions
const USER_GESTURES = {
    leftSwipe: OPEN_ORIGINAL_ARTICLE_SWIPE_ACTION,
    rightSwipe: FULL_COVERAGE_SWIPE_ACTION,
}

// ArticleSwipe setup
const swipeAction = ref({})
const showSwipeAction = ref(false);

const relativeDate = computed(() => {
    const datePublished = new Date(articleRef.value.datePublished);
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

// Swipe Gestures
const handleTouchStart = (e) => {
    startX.value = e.touches[0].clientX;
    startY.value = e.touches[0].clientY;
}

const handleTouchMove = (e) => {
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX.value;
    const deltaY = currentY - startY.value;
    const AbsPos = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX)
    // console.log(`Start: (${startX.value}, ${startY.value}), Delta: (${deltaX}, ${deltaY})`)

    const canSwipeLeft = deltaX < 0 && USER_GESTURES.leftSwipe.activateCondition(articleRef.value); // Boolean: if can swipe left according to the activatecondition
    const canSwipeRight = deltaX > 0 && USER_GESTURES.rightSwipe.activateCondition(articleRef.value); // Boolean: if can swipe right according to the activatecondition
    if (Math.abs(deltaY) < SENSITIVITY || swipeStarted.value) { // If movement is larger than sensitivity
        if (canSwipeLeft) {
            translateX.value = currentX - startX.value; // Updates the position of ArticleInstance.vue
            swipeStarted.value = true;
        }
        if (canSwipeRight) {
            translateX.value = currentX - startX.value; // Updates the position of ArticleInstance.vue
            swipeStarted.value = true;
        }

        // Limit the movement of ArticleInstance.vue value using MAXIMUMX
        if (translateX.value > MAXIMUMX) { // Right
            translateX.value = MAXIMUMX;
        } else if (translateX.value < -MAXIMUMX) { // Left
            translateX.value = -MAXIMUMX;
        }

        // Determine swipe action relative to direction
        if (translateX.value > 0) {
            swipeAction.value = USER_GESTURES.rightSwipe;
        } else if (translateX.value < 0) {
            swipeAction.value = USER_GESTURES.leftSwipe;
        }

        showSwipeAction.value = true;
    }
}

const handleTouchEnd = (e) => {
    swipeStarted.value = false
    hasTouchEnded.value = true;
    if (Math.abs(translateX.value) > SENSITIVITY) {
        if (translateX.value > THRESHOLD) { // If swipe from left
            if (USER_GESTURES.rightSwipe.action.actionFunction.length > 0)
                USER_GESTURES.rightSwipe.action.actionFunction(articleRef.value);
            else
                USER_GESTURES.rightSwipe.action.actionFunction();
        } else if (translateX.value < -THRESHOLD) { // If swipe from right
            if (USER_GESTURES.leftSwipe.action.actionFunction.length > 0)
                USER_GESTURES.leftSwipe.action.actionFunction(articleRef.value);
            else
                USER_GESTURES.leftSwipe.action.actionFunction();
        }
    }
    // Reset translateX to 0 after the touch ends
    translateX.value = 0;
    showSwipeAction.value = false;
    hasTouchEnded.value = false;
}
</script>

<template>
    <div id="article-instance" class="article-instance">
        <!--<div id="article-instance" class="article-instance" :style="{ transform: `translateX(${translateX}px)` }"
        :class="{ 'animate': swipeStarted }" @touchstart="handleTouchStart" @touchmove="handleTouchMove"
        @touchend="handleTouchEnd">
        -->

        <!-- <ArticleSwipe :action="swipeAction" v-if="showSwipeAction" :style="{ width: `${Math.abs(translateX) + 10}px` }" :opacity="Math.abs(translateX) / 100 - 0.05">
        </ArticleSwipe> -->

        <!--<img class="article-image" v-if="articleRef.imageUrl" :src="articleRef.imageUrl" alt="Article Image"
            :class="{ 'animate': swipeStarted }" @error="handleImageError">
            -->
        <img class="article-image" v-if="articleRef.imageUrl" :src="articleRef.imageUrl" alt="Article Image"
            @error="handleImageError">
        <!--<div class="shader" :class="{ 'animate': swipeStarted }">-->
        <div class="shader">

            <div class="textual-content">
                <div class="article-title text-shader">
                    {{ articleRef.title }}
                </div>
            </div>

            <div class="genre-list">
                <div class="genre" v-for="genre in articleRef.genre" @click="clickGenre(genre)">{{ genre }}</div>
            </div>

            <div class="bottom_row">
                <div class="authorsAndDate">
                    <div class="authors expanded">
                        {{ articleRef.author.length === 0 ? "" : "By: " + articleRef.author.join(', ') }}
                    </div>
                    <div class="source-date">{{ articleRef.source }}, {{ relativeDate }}</div>
                </div>

                <div class="actions">
                    <ActionItem :action="shareAction" :article="article"></ActionItem>
                    <ActionItem :action="fullCoverageAction" :article="article" v-if="articleRef.eventUri"></ActionItem>
                    <ActionItem :action="bookmarkAction" :article="article"
                        v-if="!userProfile.user?.bookmarks.includes(article.uuid)"></ActionItem>
                    <ActionItem :action="removeBookmarkAction" :article="article"
                        v-else-if="userProfile.user.bookmarks.includes(article.uuid)"></ActionItem>
                    <!-- <ActionItem :action="dailyRecapAction" :article="article" v-if="articleRef.drUri"></ActionItem> -->
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.article-instance {
    width: 100%;
    min-width: 100%;
    box-shadow: 0px 6px 10px 0px #7c7c7c;
    margin: 1% 0 4% 0;
    border-radius: var(--border-radius);
    box-sizing: border-box;

    position: relative;

    display: flex;
    flex-direction: column;
    /* Ensures the image has at least a 20:9 aspect ratio */
    min-height: calc(100vw * 9 / 20);
}

.event-page {
    background-color: #62fef7 !important;
}

.article-instance.error {
    background: var(--error-color);
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
    flex-wrap: nowrap;
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
    color: white;
}

.article-title.imageless {
    width: 90%;
}

.textual-content {
    width: 100%;
    position: relative;

    display: flex;
    flex-direction: column;

    box-sizing: border-box;
}

.article-image {
    border-radius: var(--border-radius);
    width: 100%;
    min-height: calc(100vw * 9 / 20);
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
    width: 100%;
}

.genre-list {
    width: 100%;
    display: flex;
    flex-direction: row;
    overflow: auto;
    gap: 10px;
    min-height: 30px;
}

.genre {
    width: fit-content;
    color: black;
    background-color: #E5CDC8;
    background: var(--main-color);
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
}
</style>

<style>
.text-shader {
    background-color: #000000ab;
    padding: 10px;
    border-radius: 4px;
    color: white;
    width: fit-content;
}

.animate {
    border-radius: 0 !important;
}
</style>