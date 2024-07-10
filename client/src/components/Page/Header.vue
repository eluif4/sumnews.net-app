<script setup>
import '../../global.css'
import DOMPurify from 'dompurify'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { config } from '../../constants.js'
import { showPopup, front_getArticlesFromDB, goBack } from '../../scripts/utility.js'
import { List } from '../../main.js'
import router from '../../router/index.js'

const FRONTEND_URL = config.url.FRONTEND_URL
const BACKEND_URL = config.url.BACKEND_URL

const PLACEHOLDER_TXT = 'Search for articles here';
const route = useRoute();
const genresLocalStorage = ref([]);
const sourcesLocalStorage = ref([]);
const searchQuery = ref('');
const isFiltering = ref(false);
const isEventsRoute = ref(route.path.includes('/event'));
const isSearchRoute = ref(route.path.includes('/search'));
// Set the placholder on page reload
const placeholder = ref(isSearchRoute.value ? searchQuery.value : isEventsRoute.value ? 'Full Coverage' : PLACEHOLDER_TXT);

async function performSearch() {
    if (searchQuery.value.length > 0) { // If searchQuery isnt empty
        localStorage.setItem('searchQuery', searchQuery.value);
        List.articles = [];
        document.getElementById('search-input').blur() // Unfocus the search box and hide keyboard
        sanitizeSearchQuery()
        placeholder.value = searchQuery.value;

        router.push({ path: '/search', query: { searchQuery: searchQuery.value } });
    } else {
        showPopup(2, `Invalid search query. Please enter a valid search expression`)
        const searchIcon = document.getElementById('search-icon');
        searchIcon.classList.add('invalid-input')
        setTimeout(() => {
            searchIcon.classList.remove('invalid-input');
        }, 350);
    }
}

function sanitizeSearchQuery() {
    const searchIcon = document.getElementById('search-icon');

    searchQuery.value = DOMPurify.sanitize(searchQuery.value)
    searchQuery.value = searchQuery.value.slice(0, 64);
    const validFormatRegex = /^[a-zA-Z0-9., ]+$/;
    if (!validFormatRegex.test(searchQuery.value)) {
        searchIcon.classList.add('invalid-input')
        setTimeout(() => {
            searchIcon.classList.remove('invalid-input');
        }, 350);
    }
    searchQuery.value = searchQuery.value.split('').filter(char => validFormatRegex.test(char)).join('');
}

async function resetHeader() {
    localStorage.setItem('genres', JSON.stringify([]))
    genresLocalStorage.value = []

    localStorage.setItem('sources', JSON.stringify([]))
    sourcesLocalStorage.value = []

    localStorage.setItem('searchQuery', JSON.stringify(''))
    searchQuery.value = ''

    isFiltering.value = false;
    searchQuery.value = '';
    placeholder.value = "Search for articles here"

    List.articles = []

    document.getElementById('article-stack').scrollTop = 0;
    if (route.path.includes('/event')) {
        goBack();
    }
    else {
        router.push({ name: 'home' })
        var response = await front_getArticlesFromDB();
        List.articles = response
    }
}

// Watch router and design page accordingly
watch(() => route.path, (newPath, oldPath) => {
    if (newPath.includes('/event/')) {
        isEventsRoute.value = true;
        isSearchRoute.value = false;
        placeholder.value = 'Full coverage'
    } else if (newPath.includes('/search') || JSON.parse(localStorage.getItem('searchQuery'))) {
        isEventsRoute.value = false;
        isSearchRoute.value = true;
    } else if (oldPath.includes('/filter')) {
        genresLocalStorage.value = localStorage.getItem('genres');
        sourcesLocalStorage.value = localStorage.getItem('sources');
        const genres = JSON.parse(genresLocalStorage.value);
        const sources = JSON.parse(sourcesLocalStorage.value);
        isFiltering.value = genres.length > 0 || sources.length > 0

        if (isFiltering.value) {
            // Create placeholder text
            placeholder.value = 'Filtering ';
            if (genres.length > 0) {
                placeholder.value += ` ${genres.join(", ")}`;
            }

            if (sources.length > 0 > 0) {
                if (genres.length > 0 > 0) {
                    placeholder.value += `, `;
                }
                placeholder.value += `${sources.join(", ")}`;
            }
        }
        // placeholder.value = `Filtering Sources:[${JSON.parse(sourcesLocalStorage.value).join(",")}] Genres:[${JSON.parse(genresLocalStorage.value).join(",")}]`;
    }
    else {
        isEventsRoute.value = false
        isSearchRoute.value = false;
        // searchQuery.value = '';
    }
});
</script>

<template>
    <div class="topbar">
        <div class="search">
            <div class="searchIconContainer" v-if="!isEventsRoute && !isSearchRoute && !isFiltering">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none"
                    id="search-icon">
                    <path
                        d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z"
                        stroke="#828282" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M17.5 17.5L13.875 13.875" stroke="#4F4F4F" stroke-width="1.6" stroke-linecap="round"
                        stroke-linejoin="round" />
                </svg>
            </div>
            <div class="backActionContainer" @click="resetHeader" v-else>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M22.125 12C22.125 12.2984 22.0065 12.5845 21.7955 12.7955C21.5845 13.0065 21.2984 13.125 21 13.125H5.71499L9.79499 17.205C9.90552 17.308 9.99417 17.4322 10.0557 17.5702C10.1171 17.7082 10.1502 17.8572 10.1529 18.0082C10.1555 18.1593 10.1278 18.3093 10.0712 18.4494C10.0146 18.5895 9.93037 18.7167 9.82354 18.8236C9.71672 18.9304 9.58947 19.0146 9.44938 19.0712C9.3093 19.1278 9.15926 19.1556 9.0082 19.1529C8.85715 19.1502 8.70818 19.1172 8.57018 19.0557C8.43218 18.9942 8.30798 18.9055 8.20499 18.795L2.20499 12.795C1.99431 12.5841 1.87598 12.2981 1.87598 12C1.87598 11.7019 1.99431 11.416 2.20499 11.205L8.20499 5.20501C8.41825 5.00629 8.70032 4.89811 8.99177 4.90325C9.28322 4.90839 9.5613 5.02646 9.76742 5.23258C9.97354 5.4387 10.0916 5.71678 10.0967 6.00823C10.1019 6.29968 9.99371 6.58175 9.79499 6.79501L5.71499 10.875H21C21.2984 10.875 21.5845 10.9935 21.7955 11.2045C22.0065 11.4155 22.125 11.7016 22.125 12Z"
                        fill="#4F4F4F" />
                </svg>
            </div>

            <input id="search-input" type="text" :placeholder="placeholder" class="search-box" :disabled="isEventsRoute"
                @keyup.enter="performSearch" v-model="searchQuery" @input="sanitizeSearchQuery" @click.stop />

            <router-link :to="{ path: '/filter' }" class="filter" v-if="!isEventsRoute">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="18" viewBox="0 0 20 18" fill="none">
                    <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M15.8369 10.8503C17.6959 10.8503 19.2082 12.3551 19.2082 14.2043C19.2082 16.0536 17.6959 17.5583 15.8369 17.5583C13.9768 17.5583 12.4634 16.0536 12.4634 14.2043C12.4634 12.3551 13.9768 10.8503 15.8369 10.8503ZM15.8369 12.4753C14.8727 12.4753 14.0884 13.251 14.0884 14.2043C14.0884 15.1588 14.8727 15.9333 15.8369 15.9333C16.8 15.9333 17.5832 15.1588 17.5832 14.2043C17.5832 13.251 16.8 12.4753 15.8369 12.4753ZM7.92033 13.4339C8.36882 13.4339 8.73283 13.7979 8.73283 14.2464C8.73283 14.6949 8.36882 15.0589 7.92033 15.0589H1.09424C0.645742 15.0589 0.281742 14.6949 0.281742 14.2464C0.281742 13.7979 0.645742 13.4339 1.09424 13.4339H7.92033ZM3.62242 0.333344C5.4825 0.333344 6.99483 1.83918 6.99483 3.68843C6.99483 5.53768 5.4825 7.04134 3.62242 7.04134C1.76342 7.04134 0.25 5.53768 0.25 3.68843C0.25 1.83918 1.76342 0.333344 3.62242 0.333344ZM3.62242 1.95834C2.65933 1.95834 1.875 2.73401 1.875 3.68843C1.875 4.64176 2.65933 5.41634 3.62242 5.41634C4.58658 5.41634 5.36983 4.64176 5.36983 3.68843C5.36983 2.73401 4.58658 1.95834 3.62242 1.95834ZM17.7904 2.93378C18.2389 2.93378 18.6029 3.29778 18.6029 3.74628C18.6029 4.19478 18.2389 4.55878 17.7904 4.55878H10.9654C10.5169 4.55878 10.1529 4.19478 10.1529 3.74628C10.1529 3.29778 10.5169 2.93378 10.9654 2.93378H17.7904Z"
                        fill="#4F4F4F" />
                </svg>
            </router-link>
        </div>
        <router-link to="/account" class="account">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 26 26" fill="none">
                <g clip-path="url(#clip0_1_201)">
                    <path
                        d="M21.8843 20.1012C20.7305 18.2422 18.1907 16.25 12.9988 16.25C7.80691 16.25 5.26866 18.2406 4.11328 20.1012C5.17779 21.4358 6.52952 22.5131 8.0679 23.253C9.60628 23.9929 11.2917 24.3764 12.9988 24.375C14.7059 24.3764 16.3913 23.9929 17.9297 23.253C19.468 22.5131 20.8198 21.4358 21.8843 20.1012Z"
                        fill="#4F4F4F" />
                    <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M13 14.625C14.2929 14.625 15.5329 14.1114 16.4471 13.1971C17.3614 12.2829 17.875 11.0429 17.875 9.75C17.875 8.45707 17.3614 7.21709 16.4471 6.30285C15.5329 5.38861 14.2929 4.875 13 4.875C11.7071 4.875 10.4671 5.38861 9.55285 6.30285C8.63861 7.21709 8.125 8.45707 8.125 9.75C8.125 11.0429 8.63861 12.2829 9.55285 13.1971C10.4671 14.1114 11.7071 14.625 13 14.625Z"
                        fill="#4F4F4F" />
                    <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M13 1.625C9.98316 1.625 7.08989 2.82343 4.95666 4.95666C2.82343 7.08989 1.625 9.98316 1.625 13C1.625 16.0168 2.82343 18.9101 4.95666 21.0433C7.08989 23.1766 9.98316 24.375 13 24.375C16.0168 24.375 18.9101 23.1766 21.0433 21.0433C23.1766 18.9101 24.375 16.0168 24.375 13C24.375 9.98316 23.1766 7.08989 21.0433 4.95666C18.9101 2.82343 16.0168 1.625 13 1.625ZM0 13C0 9.55219 1.36964 6.24558 3.80761 3.80761C6.24558 1.36964 9.55219 0 13 0C16.4478 0 19.7544 1.36964 22.1924 3.80761C24.6304 6.24558 26 9.55219 26 13C26 16.4478 24.6304 19.7544 22.1924 22.1924C19.7544 24.6304 16.4478 26 13 26C9.55219 26 6.24558 24.6304 3.80761 22.1924C1.36964 19.7544 0 16.4478 0 13Z"
                        fill="#4F4F4F" />
                </g>
                <defs>
                    <clipPath id="clip0_1_201">
                        <rect width="26" height="26" fill="white" />
                    </clipPath>
                </defs>
            </svg>
        </router-link>
    </div>
</template>

<style scoped>
.topbar {
    margin: 10px;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
}

.search {
    height: 50px;
    padding: 0 15px;
    /* width: 80%; */
    box-sizing: border-box;
    background-color: #EBEFEE;
    font-size: 12px;
    border-radius: var(--border-radius);
    ;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 15px;
}

.search-box {
    height: 100%;
    width: 100%;
    background-color: transparent;
    font-size: 12px;
    border-radius: 5px;
    /* padding: 5px 10px; */
    color: #4F4F4F;
    /* border: none; */
    box-sizing: border-box;
    outline: none;
}

.account {
    margin: 0 10px;
    /* flex: 1; */
}

.invalid-input {
    color: red;
    animation: shake 350ms linear;
}

@keyframes shake {
    0% {
        transform: translateX(0);
    }

    25% {
        transform: translateX(8px);
    }

    50% {
        transform: translateX(-8px);
    }

    75% {
        transform: translateX(4px);
    }

    100% {
        transform: translateX(0);
    }
}
</style>