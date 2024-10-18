<script setup>
import '../../global.css';
import { ref } from 'vue'
import { front_getArticlesFromDB, goBack } from '../../scripts/utility.js'
import { List, Sources, Genres } from '../../main.js'
import { useRouter } from 'vue-router'

import FilterOption from './FilterOption.vue'

const router = useRouter();
const options = ref(['source', 'genre']);
const selectedOption = ref('source');
const translateY = ref(0);
const startY = ref(0);
const THRESHOLD = 100;
const SCREENHEIGHT = window.innerHeight;
// const reset = ref(false); // Reset FilterOption.vue isChecked ref value ( resets checked values )

async function filterHandler() {
    // Retrieve articles from localStorage
    const storedSources = JSON.parse(localStorage.getItem('sources')) || [];
    const storedGenres = JSON.parse(localStorage.getItem('genres')) || [];
    var filter = {};

    List.articles = []; // Set articles to empty array to display the ArticleSkeleton.vue
    router.push({ name: 'home' });

    if (storedSources.length > 0 || storedGenres.length > 0) {
        filter = {
            $or: [
                { "genre": { "$in": storedGenres } },
                { "source": { "$in": storedSources } }
            ]
        };
    } else {
        filter = {}
    }

    var response = await front_getArticlesFromDB(filter);
    List.articles = response;
    document.getElementById('article-stack').scrollTop = 0;
}

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
    if (translateY.value === SCREENHEIGHT)
        goBack()
}

// Values in localStorage on render
const localStorageGenres = JSON.parse(localStorage.getItem('genres'));
const localStorageSources = JSON.parse(localStorage.getItem('sources'));

function backClick() {
    // Values in localStorage on click
    const localStorageGenresAfterClick = JSON.parse(localStorage.getItem('genres'));
    const localStorageSourcesAfterClick = JSON.parse(localStorage.getItem('sources'));

    /*
    If when backdrop is rendered both localstorages have different values (user didnt click apply), 
    revert localstorage values to their previous ones
    */
    if (localStorageGenres != localStorageGenresAfterClick) {
        localStorage.setItem('genres', JSON.stringify(localStorageGenres));
    }
    if (localStorageSources != localStorageSourcesAfterClick) {
        localStorage.setItem('sources', JSON.stringify(localStorageSources));
    }

    goBack();
}
</script>

<template>
    <div class="filter">
        <!-- <div class="close-bar"></div> -->
        <div class="top-row">
            <div @click="backClick" class="back-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M22.125 12C22.125 12.2984 22.0065 12.5845 21.7955 12.7955C21.5845 13.0065 21.2984 13.125 21 13.125H5.71499L9.79499 17.205C9.90552 17.308 9.99417 17.4322 10.0557 17.5702C10.1171 17.7082 10.1502 17.8572 10.1529 18.0082C10.1555 18.1593 10.1278 18.3093 10.0712 18.4494C10.0146 18.5895 9.93037 18.7167 9.82354 18.8236C9.71672 18.9304 9.58947 19.0146 9.44938 19.0712C9.3093 19.1278 9.15926 19.1556 9.0082 19.1529C8.85715 19.1502 8.70818 19.1172 8.57018 19.0557C8.43218 18.9942 8.30798 18.9055 8.20499 18.795L2.20499 12.795C1.99431 12.5841 1.87598 12.2981 1.87598 12C1.87598 11.7019 1.99431 11.4159 2.20499 11.205L8.20499 5.205C8.41825 5.00628 8.70032 4.89809 8.99177 4.90324C9.28322 4.90838 9.5613 5.02645 9.76742 5.23257C9.97354 5.43869 10.0916 5.71676 10.0967 6.00821C10.1019 6.29967 9.99371 6.58174 9.79499 6.795L5.71499 10.875H21C21.2984 10.875 21.5845 10.9935 21.7955 11.2045C22.0065 11.4155 22.125 11.7016 22.125 12Z"
                        fill="black" />
                </svg>
            </div>
            <p class="title">Filter</p>
            <!-- <p class="reset" @click="resetFilter">Reset</p> -->
        </div>
        <div class="selection">
            <button v-for="option in options" :key="option" @click="selectedOption = option"
                :class="{ 'selection-button': true, 'selected': selectedOption === option }">{{ option.toUpperCase()
                }}</button>
        </div>
        <div class="options" id="options">
            <!-- FUTURE CHANGE: animate the list of options. have the options slide between options -->
            <FilterOption v-if="selectedOption == 'source'" v-for="option in Object.values(Sources.list).sort((a, b) => a.source.localeCompare(b.source))" :key="option.id"
                :option="option" class="filter-option">
            </FilterOption>

            <FilterOption v-if="selectedOption == 'genre'" v-for="option in Object.values(Genres.list).sort((a, b) => a.genre.localeCompare(b.genre))" :key="option.id"
                :option="option" class="filter-option">
            </FilterOption>
        </div>
        <div class="apply" @click="filterHandler">
            <button class="apply-button">APPLY</button>
        </div>
    </div>
</template>

<style scoped>
.filter-enter-active,
.filter-leave-active {
    transition: transform 0.1s ease;
}

.filter-enter,
.filter-leave-to {
    transform: translateY(100%);
}

.filter {
    width: 100%;
    height: 80%;

    display: flex;
    flex-direction: column;
    align-items: center;

    position: absolute;
    bottom: 0;
    right: 0;
    z-index: 999;
    background-color: white;
    border-radius: 20px 20px 0 0;
    padding: 26px 20px;
}

.top-row {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-direction: row;
}

.title {
    font-size: 18px;
    font-weight: bold;
    color: black;
    text-align: center;
    margin: 0 auto;
}

.back-arrow {
    margin-right: -24px;
}

.reset {
    color: #EB5757;
    font-size: 20px;
    text-decoration: underline
}

.selection {
    width: 100%;
    height: 50px;

    margin-top: 10px;
    display: flex;
    align-items: center;
    justify-content: space-around;
    flex-direction: row;

    background-color: #606060;
    border-radius: var(--border-radius);
}

.selection-button {
    height: 100%;
    width: 50%;
    border-radius: var(--border-radius);
    transition: background-color 0.3s;
    /* Smooth background color change */
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}

.selected {
    background-color: #62FEBD;
}

/* Apply the animation on non-selected buttons */
.selection-button:not(.selected) {
    color: white;
    transform: translateX(var(--slide-distance));
}

.options {
    width: 100%;
    flex: 1;
    overflow: auto;
    margin: 25px 0;
}

.apply {
    width: 100%;
    height: 50px;
    background-color: #62FEBD;
    border-radius: var(--border-radius);

    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
}

.apply-button {
    color: black;
    font-weight: bold;
    text-align: center;
}

.close-bar {
    background-color: #606060;
    width: 30%;
    height: 5px;
    position: absolute;
    top: 10px;
    right: calc((100% - 30%) / 2);
    z-index: 100;
    border-radius: 10px;
}
</style>