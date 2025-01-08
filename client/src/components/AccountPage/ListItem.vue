<script setup>
import { watch, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute();
const pageTitle = ref(formatRouteTitle(route.path));

function formatRouteTitle(routePath) {
    if (route.path.startsWith('/account/bookmarks/')) {
        return 'Bookmarks'; // If the path matches /account/bookmarks/:uuid, set title to "Bookmarks"
    }
    else {
        const parts = routePath.split('/');
        const lastPart = parts[parts.length - 1];
        const words = lastPart.split('-');
        const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
        return capitalizedWords.join(' ');
    }
}
</script>


<template>
    <div id="container">
        <!-- <router-link to="/account" class="top-row">
            <i class="material-symbols-outlined">chevron_left</i>
        </router-link> -->
        <div class="header">
            <div class="left">
                <router-link :to="{ path: '/account' }" class="back-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path fill-rule="evenodd" clip-rule="evenodd"
                            d="M22.125 12C22.125 12.2984 22.0065 12.5845 21.7955 12.7955C21.5845 13.0065 21.2984 13.125 21 13.125H5.71499L9.79499 17.205C9.90552 17.308 9.99417 17.4322 10.0557 17.5702C10.1171 17.7082 10.1502 17.8572 10.1529 18.0082C10.1555 18.1593 10.1278 18.3093 10.0712 18.4494C10.0146 18.5895 9.93037 18.7167 9.82354 18.8236C9.71672 18.9304 9.58947 19.0146 9.44938 19.0712C9.3093 19.1278 9.15926 19.1556 9.0082 19.1529C8.85715 19.1502 8.70818 19.1172 8.57018 19.0557C8.43218 18.9942 8.30798 18.9055 8.20499 18.795L2.20499 12.795C1.99431 12.5841 1.87598 12.2981 1.87598 12C1.87598 11.7019 1.99431 11.4159 2.20499 11.205L8.20499 5.205C8.41825 5.00628 8.70032 4.89809 8.99177 4.90324C9.28322 4.90838 9.5613 5.02645 9.76742 5.23257C9.97354 5.43869 10.0916 5.71676 10.0967 6.00821C10.1019 6.29967 9.99371 6.58174 9.79499 6.795L5.71499 10.875H21C21.2984 10.875 21.5845 10.9935 21.7955 11.2045C22.0065 11.4155 22.125 11.7016 22.125 12Z"
                            fill="black" />
                    </svg>
                </router-link>
            </div>
            <div class="middle">
                <h1 class="title">{{ pageTitle }}</h1>
            </div>
        </div>
        <div class="view">
            <router-view></router-view>
        </div>
    </div>
</template>

<style scoped>
/* #container {
    height: calc(100%) !important;
    width: 100%;
    box-sizing: border-box;
    background-color: var(--footer-menus-color);
    color: white;

    display: flex;
    flex-direction: column;
    justify-content: flex-start;

    overflow: auto;
} */

#container {
    height: calc(100%) !important;
    width: 100%;
    box-sizing: border-box;
    background-color: transparent;

    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    color: black;
    padding: 20px 20px 0 20px;

    /* background-image: url('../assets/icons/swirls.svg'); */
    background-repeat: no-repeat;
    background-size: cover;
    /* or contain */
}

.header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
}

.middle {
    text-align: center;
    position: absolute;
    right: 50%;
    transform: translate(50%, 0);
}

.title {
    font-size: 20px;
    font-weight: bold;
}

.back-arrow {
    background-color: #EBEFEE;
    width: -moz-fit-content;
    width: fit-content;
    height: -moz-fit-content;
    height: fit-content;
    border-radius: var(--border-radius);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px;
}

.top-row {
    >i {
        font-size: 36px !important;
    }

    width: fit-content;
    color: var(--main-color);
    padding: 15px;
}

.view {
    /* padding: 0 15px; */
    overflow: auto;
    margin-top: 20px;
    padding-bottom: 20px;
    scrollbar-width: none;
}

h1 {
    margin: 0;
}

.domain {
    color: var(--main-color)
}

@keyframes AnimationName {
    0% {
        background-position: 0% 51%
    }

    50% {
        background-position: 100% 50%
    }

    100% {
        background-position: 0% 51%
    }
}

@-webkit-keyframes AnimationName {
    0% {
        background-position: 0% 51%
    }

    50% {
        background-position: 100% 50%
    }

    100% {
        background-position: 0% 51%
    }
}

.background {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
}
</style>