<script setup>
import router from '../../router/index.js';

var hasUserAllowedCookies = localStorage.getItem('hasAgreedToCookies');

function decision(bool) {
    if (bool)
        localStorage.setItem('hasAgreedToCookies', 'true');
    else
        localStorage.setItem('hasAgreedToCookies', 'false');

    document.getElementById('cookiePopup').style.display = 'none';
    router.push('/');
}
</script>

<template>
    <div role="alert" class="alert cookie" id="cookiePopup" v-if="!hasUserAllowedCookies">
        <!-- <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg> -->
        <i class="material-symbols-outlined icon">cookie</i>
        <span>We use cookies to enhance your experience on our site. By continuing to browse, you agree to our use of
            cookies. <router-link to="/account/privacypolicy"><span class="link">[Learn more]</span></router-link>
        </span>
        <div class="buttons">
            <button class="btn btn-sm btn-primary" @click="decision(true)">Got it</button>
        </div>
    </div>
</template>

<style scoped>
.cookie {
    position: absolute;
    bottom: calc(var(--footer-height));
    width: 92%;
    z-index: 9999;
    margin: 2% 4%;
    box-sizing: border-box;
    bottom: 10px;
}

.icon {
    font-size: 32px;
}

.link {
    /* color: white; */
    font-style: underline;
}

.buttons {
    display: flex;
    flex-direction: row;
    gap: 20%;
    justify-content: center;
    width: 40%;
}

.buttons * {
    width: 100%;
    background: linear-gradient(-90deg, rgba(98, 254, 189, 1) 0%, rgba(206, 250, 231, 1) 100%);
    background-attachment: fixed;
    border: 1px solid black;
}
</style>