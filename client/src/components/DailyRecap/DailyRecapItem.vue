<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import router from '../../router';
// import sumnewsbanner from '../../assets/icons/sumnews.net_banner.png';
const props = defineProps({ dailyrecap: Object });
const route = useRoute();

const drEventString = ref(props.dailyrecap.drEvents[0].id);
const dailyrecapUUID = ref(props.dailyrecap.id);

// const drEvent = ref(props.dailyrecap.drEvents.find(drevent => drevent.id == route.params.drEvent));
const drEvent = ref(props.dailyrecap.drEvents[0]);
// const drEvent = ref(props.drEvent);

watch(() => route.params.drEvent, (newDrEvent, oldDrEvent) => {
    if (dailyrecapUUID.value == route.params.dailyrecapUUID) {
        drEvent.value = props.dailyrecap.drEvents.find(drevent => drevent.id == newDrEvent);
    }
    else {
        drEvent.value = props.dailyrecap.drEvents[0]
    }
});

// Watch for changes in the dailyrecapUUID route parameter
watch(() => route.params.dailyrecapUUID, (newUUID, oldUUID) => {
    dailyrecapUUID.value = newUUID;
});

const currentDailyRecapIndex = ref(0);

const { sourceLogo } = props.dailyrecap;

// FUTURE CHANGE: IMPORT THE FOLLOWING VALUES FROM ARTICLECONTENT.VUE
const formattedSummary = computed(() => {
    return drEvent.value.summary
        // .replace(/<vocab>/g, '<span class="vocab">')
        .replace(/<squote>/g, '<span class="squote">')
        .replace(/<quote>/g, '<span class="quote">')
        .replace(/\*\*/g, '') // Remove all bolding
        // .replace(/<\/vocab>/g, '</span>')
        .replace(/<\/squote>/g, '</span>')
        .replace(/<\/quote>/g, '</span>')
    // .replace('**', "<b>")
});

const formattedTimeSaved = computed(() => {
    const minutes = drEvent.value.minutesSaved;
    if (minutes < 1) return "< 1 Minute Saved";
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} saved`;
});

const formattedArticleCount = computed(() => {
    const articleCount = drEvent.value.articleCount;
    if (articleCount == 1)
        return "1 Article"
    return `${articleCount} Articles`
})

const getMonthOfYear = (date) => {
    // const monthsOfYear = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    const monthsOfYear = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]
    return monthsOfYear[date.getMonth()]
}

const formattedDate = computed(() => {
    const datePublished = drEvent.value.dateCreated;
    var inputDate = undefined;

    if (datePublished) {
        inputDate = new Date(datePublished)

        const day = inputDate.getDate();
        const month = inputDate.getMonth() + 1; // Months are 0-based, so add 1
        const year = inputDate.getFullYear();
        const hours = inputDate.getHours() < 10 ? `0${inputDate.getHours()}` : inputDate.getHours();
        const minutes = inputDate.getMinutes() < 10 ? `0${inputDate.getMinutes()}` : inputDate.getMinutes();

        return `${getMonthOfYear(inputDate)} ${day}, ${year} at ${hours}:${minutes}`;
    }
    return inputDate == undefined ? 'Error' : inputDate;
});

function goToFullCoverage(eventUri) {
    if (eventUri) {
        router.push({
            name: 'fullcoverage',
            param: { eventUri: eventUri }
        })
    }
}
// const startX = ref(0);
// const currentX = ref(0);
// const isSwiping = ref(false);
// const containerStyle = ref({ transform: 'translateX(0)' });

// const handleTouchStart = (event) => {
//     startX.value = event.touches[0].clientX;
//     // isSwiping.value = true;
// };

// const handleTouchMove = (event) => {
//     if (isSwiping.value) {
//         currentX.value = event.touches[0].clientX;
//         const deltaX = currentX.value - startX.value;
//         containerStyle.value = { transform: `translateX(${deltaX}px)` };
//     }
// };

// const handleTouchEnd = () => {
//     if (isSwiping.value) {
//         const deltaX = currentX.value - startX.value;
//         if (deltaX > 100) {
//             containerStyle.value = { transform: 'translateX(100%)', transition: 'transform 0.3s ease' };
//         } else if (deltaX < -100) {
//             containerStyle.value = { transform: 'translateX(-100%)', transition: 'transform 0.3s ease' };
//         } else {
//             containerStyle.value = { transform: 'translateX(0)', transition: 'transform 0.3s ease' };
//         }
//         isSwiping.value = false;
//     }
// };

// onMounted(() => {
//     containerStyle.value = { transform: 'translateX(0)', transition: 'transform 0.3s ease' };
// });
</script>

<template>
    <div class="item-container" v-if="drEvent">

        <div class="image-container">
            <!-- FUTURE CHANGE: if image isnt able to load because of network error -->
            <img v-if="drEvent.imageUrl" :src="drEvent.imageUrl"
                alt="Sorry :( It seems like the article image was unable to load" class="article-image">
            <!-- <img v-else src="sumnewsbanner"> -->
            <div class="shader"></div>
        </div>

        <div class="content-container" id="content-container">
            <div class="meta-data"
                :style="{ justifyContent: dailyrecap.source === 'sumnews.net' ? 'end' : 'space-between' }">
                <img v-if="dailyrecap.source != 'sumnews.net'" class="logo" :alt="dailyrecap.source"
                    :src="'data:image/jpeg;base64,' + sourceLogo">
            </div>
            <!-- ARTICLE GENRES -->
            <div class="info-container-list">
                <div class="info-container genre">{{ drEvent.genre }}</div>
                <div class="info-container article-count">
                    {{ formattedArticleCount }}
                </div>
                <div class="info-container time-saved">
                    {{ formattedTimeSaved }}
                </div>
            </div>

            <!-- ARTICLE TITLE -->
            <div class="article-title">
                {{ drEvent.title }}
            </div>

            <!-- AUTHORS, DATE AND SOURCE -->
            <div class="authorsAndDate">
                <!-- <div class="authors">
                    {{ article.author.length === 0 ? "" : "By: " + article.author.join(', ') }}
                </div> -->
                <div class="source-date">{{ formattedDate }}</div>
                <!-- <div class="source-date">{{ dailyrecap.source }}, {{ formattedDate }}</div> -->
            </div>
            <!-- SUMMARIZED CONTENT -->
            <div class="summarized-content" v-html="formattedSummary"></div>

            <!-- READ ORIGINAL ARTICLE -->
            <!-- <a :href="article.url" target="_blank" rel="noopener noreferrer" class="original-article-link"> -->
            <!-- <div class="original-article-container" @click="goToFullCoverage(drEvent.eventUri)">
                View Related Articles ({{ drEvent.articleCount }})
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 12 12" fill="none">
                    <path
                        d="M6.38112 8.80173C6.40727 8.82785 6.42802 8.85887 6.44217 8.89302C6.45632 8.92716 6.46361 8.96376 6.46361 9.00072C6.46361 9.03768 6.45632 9.07428 6.44217 9.10842C6.42802 9.14256 6.40727 9.17358 6.38112 9.1997L5.91472 9.66564C5.43994 10.1404 4.796 10.4071 4.12456 10.4071C3.45312 10.4071 2.80918 10.1404 2.3344 9.66564C1.85962 9.19086 1.5929 8.54692 1.5929 7.87548C1.5929 7.20404 1.85962 6.56011 2.3344 6.08533L3.46456 4.9547C3.92105 4.49769 4.53499 4.23249 5.18065 4.21341C5.82631 4.19432 6.45484 4.4228 6.93753 4.85205C6.96523 4.87667 6.98781 4.90651 7.00398 4.93986C7.02015 4.9732 7.02959 5.00941 7.03177 5.04641C7.03394 5.08341 7.02881 5.12047 7.01666 5.15549C7.00451 5.1905 6.98559 5.22278 6.96097 5.25048C6.93634 5.27818 6.9065 5.30076 6.87316 5.31693C6.83981 5.3331 6.8036 5.34254 6.7666 5.34472C6.7296 5.3469 6.69254 5.34176 6.65752 5.32962C6.62251 5.31747 6.59023 5.29854 6.56253 5.27392C6.18713 4.94045 5.69851 4.76302 5.19661 4.77792C4.69472 4.79282 4.21748 4.99893 3.86253 5.35408L2.7319 6.48283C2.36255 6.85218 2.15505 7.35314 2.15505 7.87548C2.15505 8.39783 2.36255 8.89878 2.7319 9.26814C3.10126 9.6375 3.60221 9.845 4.12456 9.845C4.64691 9.845 5.14786 9.6375 5.51722 9.26814L5.98315 8.80173C6.00927 8.77558 6.04029 8.75484 6.07444 8.74068C6.10858 8.72653 6.14518 8.71925 6.18214 8.71925C6.2191 8.71925 6.2557 8.72653 6.28984 8.74068C6.32398 8.75484 6.355 8.77558 6.38112 8.80173ZM9.66565 2.33298C9.19056 1.85879 8.54674 1.59247 7.8755 1.59247C7.20425 1.59247 6.56043 1.85879 6.08534 2.33298L5.61893 2.79892C5.5928 2.82505 5.57207 2.85607 5.55793 2.89022C5.54379 2.92436 5.53651 2.96095 5.53651 2.99791C5.53651 3.03486 5.54379 3.07145 5.55793 3.10559C5.57207 3.13974 5.5928 3.17076 5.61893 3.19689C5.67171 3.24966 5.74328 3.27931 5.81792 3.27931C5.85487 3.27931 5.89147 3.27203 5.92561 3.25789C5.95975 3.24375 5.99077 3.22302 6.0169 3.19689L6.48284 2.72814C6.8522 2.35878 7.35315 2.15128 7.8755 2.15128C8.39784 2.15128 8.8988 2.35878 9.26815 2.72814C9.63751 3.09749 9.84501 3.59845 9.84501 4.1208C9.84501 4.64314 9.63751 5.1441 9.26815 5.51345L8.13753 6.64736C7.78258 7.00251 7.30534 7.20861 6.80344 7.22352C6.30155 7.23842 5.81292 7.06098 5.43753 6.72751C5.40983 6.70289 5.37755 6.68397 5.34253 6.67182C5.30752 6.65967 5.27045 6.65454 5.23345 6.65671C5.19646 6.65889 5.16025 6.66833 5.1269 6.6845C5.09355 6.70067 5.06371 6.72325 5.03909 6.75095C5.01447 6.77865 4.99554 6.81093 4.98339 6.84595C4.97125 6.88096 4.96611 6.91803 4.96829 6.95502C4.97047 6.99202 4.97991 7.02823 4.99608 7.06158C5.01225 7.09493 5.03483 7.12477 5.06253 7.14939C5.54516 7.57836 6.17349 7.80667 6.81893 7.78759C7.46437 7.7685 8.07811 7.50347 8.53456 7.04673L9.66471 5.91611C9.90012 5.68108 10.0869 5.40197 10.2144 5.09471C10.3418 4.78745 10.4075 4.45809 10.4076 4.12544C10.4077 3.7928 10.3422 3.4634 10.2149 3.15607C10.0876 2.84875 9.90094 2.56954 9.66565 2.33439V2.33298Z"
                        fill="white" />
                </svg>
            </div> -->
            <!-- </a> -->
        </div>
    </div>
</template>

<style scoped>
.item-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    /* padding-bottom: 70px; */
}

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
}

.image-container {
    position: sticky;
    width: 100%;
    height: 100vw;
    /* Add this line */
    /* Other styles for the image container */
}

.shader {
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 100vw;
    height: 100vw;
    background: linear-gradient(0deg, rgba(64, 64, 64, 1) 0%, rgba(64, 64, 64, 0) 100%);
    pointer-events: none;
}

.article-image {
    width: 100vw;
    /* Full width of the viewport */
    height: 100vw;
    /* Set height equal to width to create a square */
    object-fit: cover;
    /* Ensures the image covers the entire container */
    display: block;
    /* Removes any inline spacing around the image */
    margin: 0 auto;
    /* Centers the image */
}

.actions {
    /* width: 100%; */
    width: -moz-fit-content;
    height: -moz-fit-content;
    padding: 8px;

    position: relative;
    /* z-index: 999; */

    display: flex;
    flex-direction: row-reverse;
    justify-content: flex-start;
    flex-wrap: nowrap;
    gap: 20px;
    right: 0;
    background-color: rgba(0, 0, 0, 0.67);
    border-radius: 10px;
}

.backAction {
    flex: 1;
}

.content-container {
    width: 100%;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 10px;
    color: white;
    position: sticky;
    bottom: 0;
}

.info-container-list {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 30px;
}

.info-container {
    width: fit-content;
    border-radius: 4px;
    padding: 3px 10px;
    box-sizing: border-box;
    white-space: nowrap;
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

.article-count {
    background-color: white;
    color: black;
}

.time-saved {
    background-color: black;
    color: var(--main-color);
}

.article-title {
    font-size: 20px;
    /* font-weight: bold; */
    /* font-weight: bold; */
}

.authors,
.source-date {
    color: white;
    text-decoration: underline;
    /* font-size: 14px; */
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
    bottom: 10px;
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

.summarized-content {
    color: white;
    max-height: 40vh;
    overflow: auto;
}


.meta-data {
    height: fit-content;
    width: fit-content;
    box-sizing: border-box;
}

.logo {
    height: 60px;
    width: 60px;
    border-radius: 10px;
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
    color: black;
    background-color: rgb(152, 236, 255, 1);
    padding: 0 5px;
    border-radius: 4px;
    padding: 0 2px;
}

.quote {
    background-color: plum;
    /* margin: 0 5px; */
    border-radius: 4px;
    color: black;
}

.authorsAndDate div {
    font-size: 12px !important;
}
</style>