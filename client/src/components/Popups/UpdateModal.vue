<template>
    <div v-if="showModal" class="update-modal">
        <div class="update-modal-content">
            <h3 style="font-size: 24px;">Exciting News!</h3>
            <p style="margin: 20px 0">
                Your Sumnews.net experience has been upgraded! 
                <br>
                Click the button below to refresh the app and see the
                latest changes take effect.
            </p>
            <button @click="unregisterServiceWorker">Remove Service Worker</button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const showModal = ref(false); // Controls the visibility of the modal

// Function to check for existing service workers
const checkServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            if (registrations.length > 0) {
                // If there's at least one service worker, show the modal
                showModal.value = true;
            }
        });
    }
};

// Function to unregister the service worker and reload the page
const unregisterServiceWorker = () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            registrations.forEach((registration) => {
                registration.unregister();
            });
            // After unregistering, reload the page to load the latest content
            window.location.reload();
        });
    }
};

// Run when the component is mounted
onMounted(() => {
    checkServiceWorker();
});
</script>

<style scoped>
.update-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
}

.update-modal-content {
    width: 80%;
    background: white;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
}

.update-modal button {
    padding: 10px 20px;
    background-color: #62febd;
    border: none;
    color: black;
    border-radius: 4px;
    cursor: pointer;
}
</style>