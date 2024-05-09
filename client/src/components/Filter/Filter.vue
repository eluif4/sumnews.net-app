<script setup>
import '../../global.css';
import { ref, computed, watch, onMounted } from 'vue'
import { config } from '../../constants.js'
import { front_getArticlesFromDB, goBack } from '../../scripts/utility.js'
import { List, Sources, Genres } from '../../main.js'

import FilterOption from './FilterOption.vue'

const BACKEND_URL = config.url.BACKEND_URL;
const FRONTEND_URL = config.url.FRONTEND_URL;

const searchQuery = ref('')
const selectedOptions = [];

async function filterHandler(source, genre) {
    List.articles = []
    List.infiniteScrollCallCount = 0
    // List.filterType.searchQuery = ''
    // Change the header filter
    source !== undefined ? List.filterType.source = source : null
    genre !== undefined ? List.filterType.genre = genre : null
    // Fetching relevant articles
    // console.log('Fetching relevant articles...') // <- Add Graphics for user
    front_getArticlesFromDB({ genre: List.filterType.genre, source: List.filterType.source }).
        then(response => {
            List.articles = response
            // Scroll to top
            document.getElementById('article-stack').scrollTop = 0
            // Close the dropdown
            // isDropDownOpen.value = false;
        })
    // Store selected options and their corresponding IDs in local storage

    selectedOptionList.value.forEach(item => {
        if (item.isChecked) {
            selectedOptions.push(item);
        }
    });
    localStorage.setItem(selectedOption.value, JSON.stringify(selectedOptions));
}

// Define the options
const options = ref(['source', 'genre']);
const selectedOption = ref('source');
const selectedOptionValues = ref([]);

const selectedOptionList = computed(() => {
    if (selectedOption.value === 'source') {
        return Sources.list.sort((a, b) => a.source.localeCompare(b.source));
    } else if (selectedOption.value === 'genre') {
        return Genres.list.filter(item => item.genre != 'All').sort((a, b) => a.genre.localeCompare(b.genre));
    } else {
        return [];
    }
});

// watch(selectedOption, (newValue, oldValue) => {
//     const optionsDiv = document.getElementById('options')
//     optionsDiv.scrollTo({ top: 0 })
// });


watch(selectedOption, (newValue, oldValue) => {
    // Clear the list whenever the selected option changes
    selectedOptionList.value = [];

    // Loop through all options (regardless of source or genre)
    options.value.forEach(option => {
        const foundOption = Sources.list.find(item => item.source === option) || Genres.list.find(item => item.genre === option);
        if (foundOption) {
            selectedOptionList.value.push({ ...foundOption, isChecked: false });
        }
    });
});

const checkedValues = computed(() => {
    console.log(selectedOptionList.value.filter(item => item.isChecked))
    return selectedOptionList.value.filter(item => item.isChecked)
});

// Retrieve stored selections from local storage on mount
onMounted(() => {
    const storedOptions = localStorage.getItem(selectedOptions.value);
    if (storedOptions) {
        try {
            const parsedOptions = JSON.parse(storedOptions);
            // Update selectedOptionList based on stored selections
            selectedOptionList.value.forEach(item => {
                if (parsedOptions[item.id]) {
                    item.isChecked = parsedOptions[item.id].isChecked;
                }
            });
        } catch (error) {
            console.error('Error parsing stored options:', error);
            // Handle parsing errors gracefully, e.g., clear local storage
            localStorage.removeItem(selectedOptions.value);
        }
    }
});

function resetFilter() {
    // Clear all selections in the filter
    selectedOptionList.value.forEach(item => item.isChecked = false);

    // Clear the filter type in List
    List.filterType.source = null;
    List.filterType.genre = null;
    //  localStorage.removeItem('selectedOptions');
    // Reset articles and scroll position
    List.articles = [];
    List.infiniteScrollCallCount = 0;
    document.getElementById('article-stack').scrollTop = 0
}

</script>

<template>
    <!-- FUTURE CHANGE: toggle the filter and animate it into and out of dom -->
    <div class="filter">
        <div class="top-row">
            <div @click="goBack" class="back-arrow">
                <!-- <div class="back-arrow" @click="goBack"> -->
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M22.125 12C22.125 12.2984 22.0065 12.5845 21.7955 12.7955C21.5845 13.0065 21.2984 13.125 21 13.125H5.71499L9.79499 17.205C9.90552 17.308 9.99417 17.4322 10.0557 17.5702C10.1171 17.7082 10.1502 17.8572 10.1529 18.0082C10.1555 18.1593 10.1278 18.3093 10.0712 18.4494C10.0146 18.5895 9.93037 18.7167 9.82354 18.8236C9.71672 18.9304 9.58947 19.0146 9.44938 19.0712C9.3093 19.1278 9.15926 19.1556 9.0082 19.1529C8.85715 19.1502 8.70818 19.1172 8.57018 19.0557C8.43218 18.9942 8.30798 18.9055 8.20499 18.795L2.20499 12.795C1.99431 12.5841 1.87598 12.2981 1.87598 12C1.87598 11.7019 1.99431 11.4159 2.20499 11.205L8.20499 5.205C8.41825 5.00628 8.70032 4.89809 8.99177 4.90324C9.28322 4.90838 9.5613 5.02645 9.76742 5.23257C9.97354 5.43869 10.0916 5.71676 10.0967 6.00821C10.1019 6.29967 9.99371 6.58174 9.79499 6.795L5.71499 10.875H21C21.2984 10.875 21.5845 10.9935 21.7955 11.2045C22.0065 11.4155 22.125 11.7016 22.125 12Z"
                        fill="black" />
                </svg>
                <!-- </div> -->
            </div>
            <p class="title">Filter</p>
            <p class="reset" @click="resetFilter">Reset</p>
        </div>
        <div class="selection">
            <button v-for="option in options" :key="option" @click="selectedOption = option"
                :class="{ 'selection-button': true, 'selected': selectedOption === option }">{{ option.toUpperCase()
                }}</button>
        </div>
        <div class="options" id="options">
            <!-- FUTURE CHANGE: animte the list of options. have the options slide between options -->
            <FilterOption v-for="item in selectedOptionList" :key="item.id" :filterOption="item"
                :isChecked="item.isChecked" class="filter-option">
            </FilterOption>
        </div>
        <!-- FUTURE CHANGE: reset only the current options the user is on -->
        <div class="apply">
            <button class="apply-button" @click="filterHandler">APPLY</button>
        </div>
    </div>
</template>

<style scoped>
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
    border-radius: var(--border-radius);;
}

.selection-button {
    height: 100%;
    width: 50%;
    border-radius: var(--border-radius);;
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
    border-radius: var(--border-radius);;

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
</style>