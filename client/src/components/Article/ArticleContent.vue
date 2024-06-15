<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { goBack, showPopup, front_getArticlesFromDB } from '../../scripts/utility.js';
import { shareAction, bookmarkAction, fullCoverageAction, backAction, dailyRecapAction } from '../../scripts/actions'
import { config } from '../../constants'
import ActionItem from '../Action/ActionItem.vue';
import router from '../../router';

const route = useRoute();
const props = defineProps({ article: Object });
const articleRef = ref(props.article || {});
const isFromFullCoverage = ref(false);

const translateY = ref(0);
const startY = ref(0);
const THRESHOLD = 100;
const SCREENHEIGHT = window.innerHeight;

const FRONTEND_URL = config.url.FRONTEND_URL
const BACKEND_URL = config.url.BACKEND_URL

// FUNCTIONS
const getMonthOfYear = (date) => {
    // const monthsOfYear = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    const monthsOfYear = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]
    return monthsOfYear[date.getMonth()]
}

const formattedDate = computed(() => {
    const datePublished = articleRef.value.datePublished;
    if (datePublished) {
        const inputDate = new Date(datePublished)

        const day = inputDate.getDate();
        const month = inputDate.getMonth() + 1; // Months are 0-based, so add 1
        const year = inputDate.getFullYear();
        const hours = inputDate.getHours() < 10 ? `0${inputDate.getHours()}` : inputDate.getHours();
        const minutes = inputDate.getMinutes() < 10 ? `0${inputDate.getMinutes()}` : inputDate.getMinutes();

        return `${getMonthOfYear(inputDate)} ${day}, ${year} at ${hours}:${minutes}`;
    }
    return datePublished == undefined ? inputDate : datePublished;
})

const formattedSummarizedContent = computed(() => {
    return articleRef.value.summarizedContent
        // .replace(/<vocab>/g, '<span class="vocab">')
        .replace(/<squote>/g, '<span class="squote">')
        .replace(/<quote>/g, '<span class="quote">')
        .replace(/\*\*/g, '') // Remove all bolding | FUTURE CHANGE: add bolding and search for the keywords on google
        // .replace(/<\/vocab>/g, '</span>')
        .replace(/<\/squote>/g, '</span>')
        .replace(/<\/quote>/g, '</span>')
    // .replace('**', "<b>")
});

const eventUri = articleRef.value.eventUri;
const aggregatedResults = ref([]);

async function setRefAggregatedResults() {
    if (eventUri) {
        try {
            const response = await fetch(`${BACKEND_URL}db/getArticlesFromEvent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ eventUri: eventUri })
            });
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            var data = await response.json();
            data = data.eventArticles.filter(eventArticle => eventArticle.uuid !== articleRef.value.uuid);
            aggregatedResults.value = data;
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }
};

setRefAggregatedResults();
watch(
    () => route.params.uuid,
    async (newuuid) => {
        if (newuuid) {
            const response = await front_getArticlesFromDB({ uuid: newuuid }, undefined, undefined, undefined, 1);
            const article = response[0];
            if (article) {
                articleRef.value = article;
                var contentcontainerDiv = document.getElementById('content-container')
                contentcontainerDiv.scrollTo({ top: 0 })
                aggregatedResults.value = {};
                setRefAggregatedResults();
            } else {
                route.push('/error')
            }
        }
    })

// SWIPE DOWN TO DISMISS SECTION
const handleTouchStart = (e) => {
    startY.value = e.touches[0].clientY;
    e.preventDefault();
}

const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    translateY.value = currentY - startY.value;
    if (translateY.value < 0)
        translateY.value = 0; // Prevent upward draggin
    e.preventDefault();
}

const handleTouchEnd = (e) => {
    if (translateY.value > THRESHOLD) {
        translateY.value = SCREENHEIGHT;
    } else {
        translateY.value = 0;
    }
    e.preventDefault();
}

const handleTransitionEnd = () => {
    if (translateY.value === SCREENHEIGHT) {
        if (route.name == 'eventArticles') {
            router.push({ name: 'home' })
        } else {
            goBack()
        }
    }
}
</script>

<template>
    <!-- FUTURE CHANGE: add animation into routes -->
    <div class="article-container" :style="{ transform: `translateY(${translateY}px)` }"
        @transitionend="handleTransitionEnd">
        <!-- IMAGE, SHADER AND ACTIONS -->
        <div class="image-container" @touchstart="handleTouchStart" @touchmove="handleTouchMove"
            @touchend="handleTouchEnd">
            <div class="close-bar"></div>
            <div class="actions">
                <ActionItem :action="shareAction" :article="articleRef.value"></ActionItem>
                <!-- <ActionItem :action="bookmarkAction"></ActionItem> -->
                <ActionItem :action="fullCoverageAction" :article="articleRef" v-if="articleRef.eventUri"></ActionItem>
                <ActionItem :action="dailyRecapAction" :article="articleRef" v-if="articleRef.drUri"></ActionItem>
                <ActionItem :action="backAction" :article="articleRef" class="backAction"></ActionItem>
            </div>

            <!-- FUTURE CHANGE: if image isnt able to load because of network error -->
            <img v-if="articleRef.imageUrl" :src="articleRef.imageUrl"
                alt="Sorry :( It seems like the article image was unable to load" class="article-image">
            <!-- <img v-else src="../assets/icons/sumnews.net.png"
                alt="Sorry :( It seems like the article image was unable to load" class="article-image"> -->
            <div class="shader"></div>
        </div>
        <div class="content-container" id="content-container">
            <!-- ARTICLE GENRES -->
            <div class="genre-list">
                <div class="genre" v-for="genre in articleRef.genre">{{ genre }}</div>
            </div>

            <!-- ARTICLE TITLE -->
            <div class="article-title">
                {{ articleRef.title }}
            </div>

            <!-- AUTHORS, DATE AND SOURCE -->
            <div class="authorsAndDate">
                <div class="authors">
                    {{ articleRef.author.length === 0 ? "" : "By: " + articleRef.author.join(', ') }}
                </div>
                <div class="source-date">{{ articleRef.source }}, {{ formattedDate }}</div>
            </div>
            <!-- SUMMARIZED CONTENT -->
            <div class="summarized-content" v-html="formattedSummarizedContent"></div>

            <!-- FULL COVERAGE -->
            <div class="fullcoverage-container" v-if="articleRef.eventUri">
                <p class="fc-title">Read Full Coverage ({{ aggregatedResults.length }})</p>
                <!-- FUTURE CHANGE: each link here should redirect to another /article/{{ articleguid }} link when clicked on this doesnt work need to fix it -->
                <router-link :to="{ name: 'eventArticles', params: { uuid: fca.uuid } }" class="fullcoverage-article"
                    v-for="(fca, index) in aggregatedResults" :key="index">
                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 17 17" fill="none"
                        class="svg-backarrow">
                        <path
                            d="M3.44966 3.53458C2.18883 4.80958 1.41675 6.56625 1.41675 8.5C1.41675 12.41 4.59008 15.5833 8.50008 15.5833C12.4101 15.5833 15.5834 12.41 15.5834 8.5C15.5834 4.59 12.4101 1.41666 8.50008 1.41666C8.01133 1.41666 7.53675 1.46625 7.06925 1.55833"
                            stroke="#292D32" stroke-width="1.5" stroke-miterlimit="10" stroke-linecap="round"
                            stroke-linejoin="round" />
                        <path d="M7.60742 11.0004L10.1008 8.5L7.60742 5.99959" stroke="#292D32" stroke-width="1.5"
                            stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                    <p>{{ fca.source }}, {{ fca.title }}</p>
                </router-link>
            </div>

            <!-- FUTURE CHANGE: add ask ai feature with resources -->
            <!-- ASK AI only for premium users-->
            <!-- <div class="ask-ai-container" v-if="isPremiumUser">
                <div class="question" v-for="question in questions">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        v-if="questionClosed">
                        <path
                            d="M12.9375 16.875C12.9375 17.0604 12.8825 17.2417 12.7795 17.3958C12.6765 17.55 12.5301 17.6702 12.3588 17.7411C12.1875 17.8121 11.999 17.8307 11.8171 17.7945C11.6353 17.7583 11.4682 17.669 11.3371 17.5379C11.206 17.4068 11.1167 17.2398 11.0805 17.0579C11.0443 16.876 11.0629 16.6875 11.1339 16.5162C11.2048 16.3449 11.325 16.1985 11.4792 16.0955C11.6333 15.9925 11.8146 15.9375 12 15.9375C12.2486 15.9375 12.4871 16.0363 12.6629 16.2121C12.8387 16.3879 12.9375 16.6264 12.9375 16.875ZM12 6.9375C10.0313 6.9375 8.4375 8.36719 8.4375 10.125V10.5C8.4375 10.6492 8.49677 10.7923 8.60226 10.8977C8.70775 11.0032 8.85082 11.0625 9 11.0625C9.14919 11.0625 9.29226 11.0032 9.39775 10.8977C9.50324 10.7923 9.5625 10.6492 9.5625 10.5V10.125C9.5625 8.98781 10.6556 8.0625 12 8.0625C13.3444 8.0625 14.4375 8.98781 14.4375 10.125C14.4375 11.2622 13.3444 12.1875 12 12.1875C11.8508 12.1875 11.7077 12.2468 11.6023 12.3523C11.4968 12.4577 11.4375 12.6008 11.4375 12.75V13.5C11.4375 13.6492 11.4968 13.7923 11.6023 13.8977C11.7077 14.0032 11.8508 14.0625 12 14.0625C12.1492 14.0625 12.2923 14.0032 12.3978 13.8977C12.5032 13.7923 12.5625 13.6492 12.5625 13.5V13.2731C14.2603 13.0312 15.5625 11.7113 15.5625 10.125C15.5625 8.36719 13.9688 6.9375 12 6.9375ZM21.5625 12C21.5625 13.8913 21.0017 15.7401 19.9509 17.3126C18.9002 18.8852 17.4067 20.1108 15.6594 20.8346C13.9121 21.5584 11.9894 21.7477 10.1345 21.3788C8.27951 21.0098 6.57564 20.099 5.2383 18.7617C3.90096 17.4244 2.99022 15.7205 2.62125 13.8656C2.25227 12.0106 2.44164 10.0879 3.16541 8.34059C3.88917 6.59327 5.11482 5.09981 6.68736 4.04907C8.25991 2.99833 10.1087 2.4375 12 2.4375C14.5352 2.44048 16.9658 3.44891 18.7584 5.24158C20.5511 7.03425 21.5595 9.46478 21.5625 12ZM20.4375 12C20.4375 10.3312 19.9427 8.69992 19.0155 7.31238C18.0884 5.92484 16.7706 4.84338 15.2289 4.20477C13.6871 3.56615 11.9906 3.39906 10.3539 3.72462C8.71722 4.05019 7.2138 4.85378 6.03379 6.03379C4.85379 7.21379 4.05019 8.71721 3.72463 10.3539C3.39907 11.9906 3.56616 13.6871 4.20477 15.2289C4.84338 16.7706 5.92484 18.0884 7.31238 19.0155C8.69992 19.9426 10.3312 20.4375 12 20.4375C14.237 20.435 16.3817 19.5453 17.9635 17.9635C19.5453 16.3817 20.435 14.237 20.4375 12Z"
                            fill="black" />
                    </svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        v-if="!questionClosed">
                        <path
                            d="M12 22.2454C17.595 22.2454 22.2454 17.6049 22.2454 12C22.2454 6.40501 17.5847 1.75458 11.9897 1.75458C6.38529 1.75458 1.755 6.40501 1.755 12C1.755 17.6049 6.39515 22.2454 12 22.2454ZM12.0004 20.538C7.25872 20.538 3.47143 16.7409 3.47143 12C3.47143 7.26858 7.24843 3.46201 11.9897 3.46201C16.7207 3.46201 20.5273 7.26901 20.5376 12C20.5474 16.7413 16.7306 20.538 11.9996 20.538M11.9897 13.818C12.4714 13.818 12.7427 13.5467 12.7526 13.0247L12.9034 7.72115C12.9137 7.20858 12.5117 6.82715 11.9794 6.82715C11.4369 6.82715 11.0554 7.19872 11.0653 7.71086L11.196 13.0247C11.2059 13.5369 11.4874 13.818 11.9897 13.818ZM11.9897 17.0824C12.5619 17.0824 13.074 16.6204 13.074 16.038C13.074 15.4453 12.5721 14.9931 11.9897 14.9931C11.397 14.9931 10.9046 15.4552 10.9046 16.038C10.9046 16.6106 11.4069 17.0824 11.9897 17.0824Z"
                            fill="black" />
                    </svg>
                    <p class="question-title">{{ question.title }}</p>
                    <p class="question-answer" v-if="!questionClosed">{{ question.answer }}</p>
                    <div class="answer-resources" v-for="resource in question.resources">
                        <img :src="resource.img" alt="">
                        <p class="resource-title">{{ resource.title }}</p>
                    </div>
                </div>
            </div> -->

            <!-- READ ORIGINAL ARTICLE -->
            <a :href="articleRef.url" target="_blank" rel="noopener noreferrer" class="original-article-link">
                <div class="original-article-container">
                    Read original article
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 12 12" fill="none">
                        <path
                            d="M6.38112 8.80173C6.40727 8.82785 6.42802 8.85887 6.44217 8.89302C6.45632 8.92716 6.46361 8.96376 6.46361 9.00072C6.46361 9.03768 6.45632 9.07428 6.44217 9.10842C6.42802 9.14256 6.40727 9.17358 6.38112 9.1997L5.91472 9.66564C5.43994 10.1404 4.796 10.4071 4.12456 10.4071C3.45312 10.4071 2.80918 10.1404 2.3344 9.66564C1.85962 9.19086 1.5929 8.54692 1.5929 7.87548C1.5929 7.20404 1.85962 6.56011 2.3344 6.08533L3.46456 4.9547C3.92105 4.49769 4.53499 4.23249 5.18065 4.21341C5.82631 4.19432 6.45484 4.4228 6.93753 4.85205C6.96523 4.87667 6.98781 4.90651 7.00398 4.93986C7.02015 4.9732 7.02959 5.00941 7.03177 5.04641C7.03394 5.08341 7.02881 5.12047 7.01666 5.15549C7.00451 5.1905 6.98559 5.22278 6.96097 5.25048C6.93634 5.27818 6.9065 5.30076 6.87316 5.31693C6.83981 5.3331 6.8036 5.34254 6.7666 5.34472C6.7296 5.3469 6.69254 5.34176 6.65752 5.32962C6.62251 5.31747 6.59023 5.29854 6.56253 5.27392C6.18713 4.94045 5.69851 4.76302 5.19661 4.77792C4.69472 4.79282 4.21748 4.99893 3.86253 5.35408L2.7319 6.48283C2.36255 6.85218 2.15505 7.35314 2.15505 7.87548C2.15505 8.39783 2.36255 8.89878 2.7319 9.26814C3.10126 9.6375 3.60221 9.845 4.12456 9.845C4.64691 9.845 5.14786 9.6375 5.51722 9.26814L5.98315 8.80173C6.00927 8.77558 6.04029 8.75484 6.07444 8.74068C6.10858 8.72653 6.14518 8.71925 6.18214 8.71925C6.2191 8.71925 6.2557 8.72653 6.28984 8.74068C6.32398 8.75484 6.355 8.77558 6.38112 8.80173ZM9.66565 2.33298C9.19056 1.85879 8.54674 1.59247 7.8755 1.59247C7.20425 1.59247 6.56043 1.85879 6.08534 2.33298L5.61893 2.79892C5.5928 2.82505 5.57207 2.85607 5.55793 2.89022C5.54379 2.92436 5.53651 2.96095 5.53651 2.99791C5.53651 3.03486 5.54379 3.07145 5.55793 3.10559C5.57207 3.13974 5.5928 3.17076 5.61893 3.19689C5.67171 3.24966 5.74328 3.27931 5.81792 3.27931C5.85487 3.27931 5.89147 3.27203 5.92561 3.25789C5.95975 3.24375 5.99077 3.22302 6.0169 3.19689L6.48284 2.72814C6.8522 2.35878 7.35315 2.15128 7.8755 2.15128C8.39784 2.15128 8.8988 2.35878 9.26815 2.72814C9.63751 3.09749 9.84501 3.59845 9.84501 4.1208C9.84501 4.64314 9.63751 5.1441 9.26815 5.51345L8.13753 6.64736C7.78258 7.00251 7.30534 7.20861 6.80344 7.22352C6.30155 7.23842 5.81292 7.06098 5.43753 6.72751C5.40983 6.70289 5.37755 6.68397 5.34253 6.67182C5.30752 6.65967 5.27045 6.65454 5.23345 6.65671C5.19646 6.65889 5.16025 6.66833 5.1269 6.6845C5.09355 6.70067 5.06371 6.72325 5.03909 6.75095C5.01447 6.77865 4.99554 6.81093 4.98339 6.84595C4.97125 6.88096 4.96611 6.91803 4.96829 6.95502C4.97047 6.99202 4.97991 7.02823 4.99608 7.06158C5.01225 7.09493 5.03483 7.12477 5.06253 7.14939C5.54516 7.57836 6.17349 7.80667 6.81893 7.78759C7.46437 7.7685 8.07811 7.50347 8.53456 7.04673L9.66471 5.91611C9.90012 5.68108 10.0869 5.40197 10.2144 5.09471C10.3418 4.78745 10.4075 4.45809 10.4076 4.12544C10.4077 3.7928 10.3422 3.4634 10.2149 3.15607C10.0876 2.84875 9.90094 2.56954 9.66565 2.33439V2.33298Z"
                            fill="white" />
                    </svg>
                </div>
            </a>
        </div>
    </div>
</template>

<style scoped>
.article-container {
    /* height: fit-content; */
    max-height: 90%;
    width: 100%;
    background-color: white;

    position: absolute;
    bottom: 0px;
    border-radius: 30px 30px 0 0;
    z-index: 200;

    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease;
}

.image-container {
    position: relative;
    /* Add this line */
    /* Other styles for the image container */
}

.shader {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgb(0, 0, 0);
    background: linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(255, 255, 255, 0) 60%);
    /* Adjust the alpha value for the desired opacity */
    border-radius: 25px;
    pointer-events: none;
    /* Allows clicks to pass through the overlay to the image */
}

.article-image {
    border-radius: 25px;
    min-height: calc(100vw * 9 / 20);
}

.actions {
    width: 100%;
    width: -moz-fit-content;
    height: -moz-fit-content;
    padding: 20px;

    position: absolute;
    z-index: 999;

    display: flex;
    flex-direction: row-reverse;
    justify-content: flex-start;
    flex-wrap: nowrap;
    gap: 20px;
}

.backAction {
    flex: 1;
}

.content-container {
    width: 100%;
    height: 100%;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 10px;

    overflow: auto;
}

.genre-list {
    width: 100%;
    display: flex;
    flex-direction: row;
    /* FUTURE CHANGE: check why this isnt working */
    overflow: auto;
    gap: 10px;
    min-height: 30px;
}

.genre {
    width: fit-content;
    /* height: 100px; */
    color: black;
    background-color: #E5CDC8;
    background: var(--main-color);
    /* background-attachment: fixed; */
    border-radius: 4px;
    padding: 3px 10px;
    box-sizing: border-box;
    white-space: nowrap;
}

.article-title {
    font-size: 20px;
    /* font-weight: bold; */
    color: black;
    /* font-weight: bold; */
}

.authors,
.source-date {
    /* color: #828282; */
    font-size: 14px;
}

.fullcoverage-article {
    display: flex;
    flex-direction: row;
}

.svg-backarrow {
    min-width: 17px;
    min-height: 17px;
    margin: 5px 10px 0 0;
}

.fc-title {
    text-decoration: underline;
}

.original-article-link {
    width: 100%;
}

.original-article-container {
    width: 100%;
    background-color: #5D90E3;
    border-radius: 4px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    color: white;
    padding: 10px 0;
    gap: 10px;
}
</style>

<style>
/* APPLY TEXT GEN FORMATTING ONTO SUMMARIZED TEXT */
.vocab {
    /* background-color: #d4d4d4; */
    border-radius: 4px;
    color: #0056e7;
    font-weight: bold;
    padding: 0 4px;
}

.squote {
    background-color: yellow;
    padding: 0 5px;
    border-radius: 4px;
}

.quote {
    background-color: plum;
    /* margin: 0 5px; */
    border-radius: 4px;
}

.close-bar {
    background-color: white;
    width: 30%;
    height: 5px;
    position: absolute;
    top: 10px;
    right: calc((100% - 30%) / 2);
    z-index: 100;
    border-radius: 10px;
}

.summarized-content {
    color: #828282;
}
</style>