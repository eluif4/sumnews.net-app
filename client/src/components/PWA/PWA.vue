<script setup>
import { ref } from 'vue'
//https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt
const showPWA = ref(false)
let installPrompt = null

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault()
    installPrompt = event
    showPWA.value = true
});

// Method to handle the PWA installation
const installPWA = async () => {
    if (installPrompt) {
        installPrompt.prompt(); // Show the install prompt
        const { outcome } = await installPrompt.userChoice; // Wait for the user's response
        if (outcome === 'accepted') {
            console.log('PWA installed');
        } else {
            console.log('PWA installation declined');
        }
        installPrompt = null; // Clear the saved prompt
        showPWA.value = false; // Hide the install button
    }
};
</script>

<template>
    <button class="install btn sm:btn-sm md:btn-md lg:btn-lg" v-if="showPWA" @click="installPWA">
        <svg xmlns="http://www.w3.org/2000/svg" width="32px" height="32px" viewBox="0 0 24 24">
            <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                color="black" d="M6 20h12M12 4v12m0 0l3.5-3.5M12 16l-3.5-3.5" />
        </svg>
        <p class="install_text">Download Sumnews</p>
    </button>
</template>

<style scoped>
.install {
    display: flex;
    flex-direction: row;
    /* gap: 13%; */
    justify-content: center;
    align-items: center;
    padding: 4%;
    background: var(--main-color);
    width: 94%;
    margin: 1% 3%;
    height: fit-content;
}

.install_text,
.icon {
    font-size: 24px;
    width: fit-content;
    height: fit-content;
    color: black;
}
</style>