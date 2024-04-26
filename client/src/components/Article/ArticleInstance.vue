<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router'
import { PopupAttributes, selectedArticle } from '../../main.js';
import { config } from '../../constants'

// import Share from './Share.vue'
// import ReadLater from './ReadLater.vue';
// import FullCoverage from './FullCoverage.vue'
import ActionItem from '../Action/ActionItem.vue'

const FRONTEND_URL = config.url.FRONTEND_URL
const BACKEND_URL = config.url.BACKEND_URL

const router = useRouter();
const route = useRoute();

// Watch router and design page accordingly
const isEventsRoute = ref(false)

watch(() => route.path, (newPath) => {
  if (newPath.includes('/event/')) {
    isEventsRoute.value = true
  }
  else {
    isEventsRoute.value = false
  }
});

// pass article into ArticleContent
const handleArticleClick = () => {
    selectedArticle.value = props.article
};

const isLinkActive = (path) => {
    return route.path.startsWith(path);
};

const props = defineProps({ article: Object, });
// const emits = defineEmits(['toggleState'])

var isArticleInstanceOpen = ref(false)
// const isEventPage = ref(window.location.href.includes('/event/'));

// const toggleState = () => {
//     if (!props.article.url.includes('youtube.com')) {
//         isArticleInstanceOpen.value = !isArticleInstanceOpen.value;
//         // emits('toggleState', isArticleInstanceOpen.value)
//     }
// };

const setArticleInstanceState = (bool) => {
    // Given a boolean value set the Article Instance state to open or closed
    isArticleInstanceOpen.value = bool
}

const getDaySuffix = (date) => {
    const day = date.getDate()
    if (day >= 11 && day <= 13) {
        return 'th';
    }

    const lastDigit = day % 10;
    switch (lastDigit) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
};

const getDayOfWeek = (date) => {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return daysOfWeek[date.getDay()];
};

const getMonthOfYear = (date) => {
    // const monthsOfYear = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    const monthsOfYear = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]
    return monthsOfYear[date.getMonth()]
}

const formattedDate = computed(() => {
    const datePublished = props.article.datePublished
    if (datePublished) {
        const inputDate = new Date(datePublished)

        const day = inputDate.getDate();
        const month = inputDate.getMonth() + 1; // Months are 0-based, so add 1
        const year = inputDate.getFullYear();
        const hours = inputDate.getHours() < 10 ? `0${inputDate.getHours()}` : inputDate.getHours();
        const minutes = inputDate.getMinutes() < 10 ? `0${inputDate.getMinutes()}` : inputDate.getMinutes();

        return `${getMonthOfYear(inputDate)} ${day}, ${year} at ${hours}:${minutes}`;
    }
    return datePublished; // Return an empty string if datePublished is undefined
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

// function clickGenre(genre) {
//     filterHandler(undefined, genre)
// }

// defineExpose({ toggleState, setArticleInstanceState })

const formattedSummarizedContent = computed(() => {
    return props.article.summarizedContent
        .replace(/{/g, '<span style="background-color: #ffffff; color: #640785; padding: 0 3px; border-radius: 4px;">')
        .replace(/}/g, '</span>');
});

// ----- ACTION FUNCTIONS -----
// FUTURE CHANGE: import article props correctly
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

function showPopup(methodValue, msg, showTime = 3) {
    PopupAttributes.methodValue = methodValue
    PopupAttributes.msg = msg

    setTimeout(() => {
        PopupAttributes.methodValue = -1
    }, 1000 * showTime)
}

function backActionFunction() {
    router.push('/')
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

const backAction = {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M22.125 12C22.125 12.2984 22.0065 12.5845 21.7955 12.7955C21.5845 13.0065 21.2984 13.125 21 13.125H5.71499L9.79499 17.205C9.90552 17.308 9.99417 17.4322 10.0557 17.5702C10.1171 17.7082 10.1502 17.8572 10.1529 18.0082C10.1555 18.1593 10.1278 18.3093 10.0712 18.4494C10.0146 18.5895 9.93037 18.7167 9.82354 18.8236C9.71672 18.9304 9.58947 19.0146 9.44938 19.0712C9.3093 19.1278 9.15926 19.1556 9.0082 19.1529C8.85715 19.1502 8.70818 19.1172 8.57018 19.0557C8.43218 18.9942 8.30798 18.9055 8.20499 18.795L2.20499 12.795C1.99431 12.5841 1.87598 12.2981 1.87598 12C1.87598 11.7019 1.99431 11.416 2.20499 11.205L8.20499 5.20501C8.41825 5.00629 8.70032 4.89811 8.99177 4.90325C9.28322 4.90839 9.5613 5.02646 9.76742 5.23258C9.97354 5.4387 10.0916 5.71678 10.0967 6.00823C10.1019 6.29968 9.99371 6.58175 9.79499 6.79501L5.71499 10.875H21C21.2984 10.875 21.5845 10.9935 21.7955 11.2045C22.0065 11.4155 22.125 11.7016 22.125 12Z" fill="white"/></svg>`,
    actionFunction: backActionFunction,
}

const imageUrl = ref(props.article.imageUrl)

const handleImageError = () => {
    imageUrl.value = `../assets/icons/bgsumnewslogo.png`
}
</script>

<template>
    <div id="article-instance" class="article-instance" @click="handleArticleClick">

        <img class="article-image" v-if="article.imageUrl" :src="article.imageUrl" alt="Article Image" @error="handleImageError">
        <img class="article-image" v-else src="../assets/icons/bgsumnewslogo.png" alt="Article Image">
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
                    <ActionItem :action="bookmarkAction"></ActionItem>
                    <ActionItem :action="fullCoverageAction" v-if="article.eventUri"></ActionItem>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.article-instance {
    width: 100%;
    box-shadow: 0 0 10px 0px var(--browser-background-color);
    margin: 1% 0 4% 0;
    border-radius: 10px;
    box-sizing: border-box;

    position: relative;

    display: flex;
    flex-direction: column;

    /* background-color: var(--main-color); */
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
    border-radius: 10px;
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
    border-radius: 10px;
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
    border-radius: 10px;
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