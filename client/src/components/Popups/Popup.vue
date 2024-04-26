<script setup>
import { PopupAttributes } from '../../main';
</script>

<template>
    <!-- Regular popup -->
    <transition name="fade">
        <div role="alert" class="alert shadow-lg popup" v-if="PopupAttributes.methodValue == 1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info shrink-0 w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
                <h3 class="font-bold">{{ PopupAttributes.msg }}</h3>
            </div>
        </div>

        <!-- Error popup -->
        <div role="alert" class="alert alert-error popup" v-else-if="PopupAttributes.methodValue == 2">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ PopupAttributes.msg }}</span>
        </div>
    </transition>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.popup {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    position: absolute;
    margin: 2% 4%;
    /* margin: auto; */
    /* bottom: var(--footer-height); */
    bottom: 10px;
    right: 0;
    width: 92%;
    box-sizing: border-box;
    z-index: 999;
}
</style>