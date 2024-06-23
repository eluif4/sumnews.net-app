<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({ article: Object });

// FUTURE CHANGE: IMPORT THE FOLLOWING VALUES FROM ARTICLECONTENT.VUE
const formattedSummarizedContent = computed(() => {
    return props.article.summarizedContent
        // .replace(/<vocab>/g, '<span class="vocab">')
        .replace(/<squote>/g, '<span class="squote">')
        .replace(/<quote>/g, '<span class="quote">')
        // .replace('**', '<b>')
        // .replace(/<\/vocab>/g, '</span>')
        .replace(/<\/squote>/g, '</span>')
        .replace(/<\/quote>/g, '</span>')
    // .replace('**', "<b>")
});

const getMonthOfYear = (date) => {
    // const monthsOfYear = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    const monthsOfYear = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"]
    return monthsOfYear[date.getMonth()]
}

const formattedDate = computed(() => {
    const datePublished = props.article.datePublished;

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
});

const startX = ref(0);
const currentX = ref(0);
const isSwiping = ref(false);
const containerStyle = ref({ transform: 'translateX(0)' });

const handleTouchStart = (event) => {
  startX.value = event.touches[0].clientX;
  isSwiping.value = true;
};

const handleTouchMove = (event) => {
  if (isSwiping.value) {
    currentX.value = event.touches[0].clientX;
    const deltaX = currentX.value - startX.value;
    containerStyle.value = { transform: `translateX(${deltaX}px)` };
  }
};

const handleTouchEnd = () => {
  if (isSwiping.value) {
    const deltaX = currentX.value - startX.value;
    if (deltaX > 100) {
      containerStyle.value = { transform: 'translateX(100%)', transition: 'transform 0.3s ease' };
    } else if (deltaX < -100) {
      containerStyle.value = { transform: 'translateX(-100%)', transition: 'transform 0.3s ease' };
    } else {
      containerStyle.value = { transform: 'translateX(0)', transition: 'transform 0.3s ease' };
    }
    isSwiping.value = false;
  }
};

onMounted(() => {
  containerStyle.value = { transform: 'translateX(0)', transition: 'transform 0.3s ease' };
});
</script>

<template>
  <div class="item-container"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    :style="containerStyle">

    <div class="image-container">
      <img v-if="article.imageUrl" :src="article.imageUrl" alt="Sorry :( It seems like the article image was unable to load" class="article-image">
    </div>

    <div class="content-container" id="content-container">
      <div class="genre-list">
        <div class="genre" v-for="genre in article.genre" :key="genre">{{ genre }}</div>
      </div>

      <div class="article-title">{{ article.title }}</div>

      <div class="authorsAndDate">
        <div class="authors">{{ article.author.length === 0 ? "" : "By: " + article.author.join(', ') }}</div>
        <div class="source-date">{{ article.source }}, {{ formattedDate }}</div>
      </div>

      <div class="summarized-content" v-html="formattedSummarizedContent"></div>

      <a :href="article.url" target="_blank" rel="noopener noreferrer" class="original-article-link">
        <div class="original-article-container">
          Read original article
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 12 12" fill="none">
            <path d="M6.38112 8.80173C6.40727 8.82785 6.42802 8.85887 6.44217 8.89302C6.45632 8.92716 6.46361 8.96376 6.46361 9.00072C6.46361 9.03768 6.45632 9.07428 6.44217 9.10842C6.42802 9.14256 6.40727 9.17358 6.38112 9.1997L5.91472 9.66564C5.43994 10.1404 4.796 10.4071 4.12456 10.4071C3.45312 10.4071 2.80918 10.1404 2.3344 9.66564C1.85962 9.19086 1.5929 8.54692 1.5929 7.87548C1.5929 7.20404 1.85962 6.56011 2.3344 6.08533L3.46456 4.9547C3.92105 4.49769 4.53499 4.23249 5.18065 4.21341C5.82631 4.19432 6.45484 4.4228 6.93753 4.85205C6.96523 4.87667 6.98781 4.90651 7.00398 4.93986C7.02015 4.9732 7.02959 5.00941 7.03177 5.04641C7.03394 5.08341 7.02881 5.12047 7.01666 5.15549C7.00451 5.1905 6.98559 5.22278 6.96097 5.25048C6.93634 5.27818 6.9065 5.30076 6.87316 5.31693C6.83981 5.3331 6.8036 5.34254 6.7666 5.34472C6.7296 5.3469 6.69254 5.34176 6.65752 5.32962C6.62251 5.31747 6.59023 5.29854 6.56253 5.27392C6.18713 4.94045 5.69851 4.76302 5.19661 4.77792C4.69472 4.79282 4.21748 4.99893 3.86253 5.35408L2.7319 6.48283C2.36255 6.85218 2.15505 7.35314 2.15505 7.87548C2.15505 8.39783 2.36255 8.89878 2.7319 9.26814C3.10126 9.6375 3.60221 9.845 4.12456 9.845C4.64691 9.845 5.14786 9.6375 5.51722 9.26814L5.98315 8.80173C6.00927 8.77558 6.04029 8.75484 6.07444 8.74068C6.10858 8.72653 6.14518 8.71925 6.18214 8.71925C6.2191 8.71925 6.2557 8.72653 6.28984 8.74068C6.32398 8.75484 6.355 8.77558 6.38112 8.80173ZM9.66565 2.33298C9.19056 1.85879 8.54674 1.59247 7.8755 1.59247C7.20425 1.59247 6.56043 1.85879 6.08534 2.33298L5.61893 2.79892C5.5928 2.82505 5.57207 2.85607 5.55793 2.89021C5.54378 2.92435 5.5365 2.96095 5.5365 2.99791C5.5365 3.03487 5.54378 3.07147 5.55793 3.10561C5.57207 3.13975 5.5928 3.17077 5.61893 3.19689C5.64506 3.22302 5.67608 3.24376 5.71022 3.2579C5.74436 3.27205 5.78096 3.27933 5.81792 3.27933C5.85488 3.27933 5.89148 3.27205 5.92562 3.2579C5.95976 3.24376 5.99078 3.22302 6.01691 3.19689L6.48332 2.73118C6.85256 2.36234 7.35309 2.1555 7.8755 2.1555C8.39792 2.1555 8.89845 2.36234 9.26769 2.73118C9.63693 3.09963 9.84377 3.60016 9.84377 4.12258C9.84377 4.64501 9.63693 5.14554 9.26769 5.51479L8.13806 6.64442C7.77491 7.00758 7.25575 7.19287 6.73296 7.14982C6.32038 7.11573 5.92306 6.94789 5.62015 6.66875C5.59196 6.6414 5.56048 6.6183 5.52662 6.60043C5.49276 6.58256 5.45695 6.57025 5.42042 6.56394C5.38388 6.55763 5.34693 6.55746 5.31024 6.56344C5.27355 6.56943 5.23754 6.58145 5.20302 6.59904C5.16849 6.61663 5.13576 6.63956 5.10596 6.66698C5.07616 6.69439 5.04951 6.72604 5.02662 6.76083C5.00374 6.79563 4.98485 6.83325 4.97043 6.87275C4.95601 6.91224 4.9462 6.95331 4.94131 6.99499C4.93642 7.03667 4.93652 7.07852 4.9416 7.11992C4.94668 7.16132 4.9567 7.20198 4.9714 7.2412C5.29587 8.17996 6.1777 8.78361 7.16238 8.78361C7.52978 8.78366 7.89332 8.69029 8.21978 8.51355C8.56364 8.32861 8.84716 8.07058 9.04275 7.76474C9.05982 7.73745 9.08052 7.71296 9.10422 7.69164L10.2351 6.56289C10.704 6.09381 10.9996 5.47416 10.9996 4.82139C10.9996 4.16862 10.704 3.54997 10.2351 3.08089L9.66565 2.33298Z" fill="#FE6D6D"/>
          </svg>
        </div>
      </a>
    </div>
  </div>
</template>

<style scoped>
.item-container {
  display: flex;
  flex-direction: column;
  background: #FFF;
  margin: 10px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  overflow: hidden;
  touch-action: pan-y;
}

.image-container {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.article-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content-container {
  padding: 20px;
}

.genre-list {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.genre {
  background: #f0f0f0;
  border-radius: 5px;
  padding: 5px 10px;
  margin-right: 5px;
  margin-bottom: 5px;
}

.article-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
}

.authorsAndDate {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.authors {
  font-weight: bold;
}

.source-date {
  font-size: 14px;
  color: #999;
}

.summarized-content {
  margin-bottom: 20px;
}

.original-article-link {
  text-decoration: none;
  color: #FE6D6D;
  display: flex;
  align-items: center;
}

.original-article-container {
  display: flex;
  align-items: center;
  font-weight: bold;
}

.original-article-container svg {
  margin-left: 5px;
}

.squote {
  color: black !important;
  background: #fff2cc;
  padding: 0 5px;
}

.quote {
  color: black !important;
  background: #f2f2f2;
  padding: 0 5px;
}
</style>
