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
        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
            <path fill="currentColor"
                d="M12 21.5q-1.971 0-3.705-.748t-3.016-2.03t-2.031-3.017T2.5 12q0-1.933.744-3.656t2.025-3.03t3-2.073t3.664-.766q.382 0 .782.03q.4.032.802.099q-.07 1.125.275 2.038q.347.914 1.02 1.557t1.633.96q.96.318 2.138.27q-.304 1.475.62 2.652t2.286 1.361l.008.119q.003.055.003.118q0 2.017-.752 3.8q-.752 1.784-2.041 3.125q-1.29 1.34-3.016 2.118q-1.728.778-3.691.778M10.51 9.808q.538 0 .918-.39t.38-.928t-.382-.918t-.926-.38q-.529 0-.918.382t-.39.926q0 .529.39.918t.927.39m-2 5q.539 0 .919-.39t.38-.927t-.382-.919t-.926-.38q-.529 0-.918.382t-.39.926q0 .529.39.918t.928.39m6.5 1q.338 0 .568-.24t.23-.577t-.232-.569q-.233-.23-.576-.23q-.329 0-.568.233t-.24.575q0 .329.24.568t.578.24M12.004 20.5q3.23 0 5.73-2.34q2.503-2.34 2.747-5.937q-1.327-.53-2.069-1.5t-.875-2.336q-2.06-.18-3.445-1.477t-1.517-3.416q-1.904-.127-3.56.533T6.134 5.88t-1.93 2.79T3.5 12q0 3.517 2.491 6.009Q8.483 20.5 12.004 20.5M12 11.804" />
        </svg>
        <span>We use cookies to enhance your experience on our site. By continuing to browse, you agree to our
            use of
            cookies. <router-link to="/account/privacy-policy"><span class="link">[Learn more]</span></router-link>
        </span>
        <div class="buttons">
            <button class="btn btn-sm btn-primary" @click="decision(true)">Got it</button>
        </div>
    </div>
</template>

<style scoped>
.cookie {
    position: absolute;
    bottom: 0;
    width: 92%;
    z-index: 9999;
    margin: 2% 4%;
    box-sizing: border-box;
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
    color: black;
}
</style>