<script setup>
import router from '../../router';
const props = defineProps({
    dr: {
        type: Object,
        required: true,
    },
});

const { source, sourceLogo, dailyRecapId } = props.dr;

async function renderDailyRecap(dailyRecapId) {
    router.push({ name: 'dailyrecap', params: { uuid: dailyRecapId } });
}
</script>

<template>
    <button class="mycontainer" @click="renderDailyRecap(dailyRecapId)">
        <div class="dailyrecap">
            <img class="logo" :alt="source" :src="sourceLogo">
        </div>
        <p class="source-title">{{ source }}</p>
    </button>
</template>

<style scoped>
.mycontainer {
    border-radius: var(--border-radius);
    /* border: 2px solid white; */
    text-align: center;
    width: 60px;
    flex: 0 0 auto;
    /* overflow-x: none; */
}

.dailyrecap {
    height: fit-content;
    width: fit-content;
}

.logo {
    height: 60px;
    width: 60px;
    border-radius: 10px;
    /* border: 2px solid #4d4d4d; */
}

.source-title {
    font-size: 11px;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    color: black;
}
</style>