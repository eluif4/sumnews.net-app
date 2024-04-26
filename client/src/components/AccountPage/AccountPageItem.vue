<script setup>
const props = defineProps({
    page: {
        type: Object,
        required: true,
    },
});

const { svg, title, path } = props.page;
</script>

<template>
    <router-link :to="{ path: `/account/${path}` }">
        <div class="page-container">
            <div v-html="svg" v-if="svg"></div>
            <div class="title">{{ title }}</div>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="right-arrow">
                <path d="M9 6L15 12L9 18" stroke="black" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
            </svg>
        </div>
        <div class="line"></div>
    </router-link>
</template>

<style scoped>
.page-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
}

.title {
    font-size: 16px;
}

.right-arrow {
    /* flex: 1; */
    margin-left: auto;
}

.line {
    background-color: #BDBDBD;
    width: 100%;
    height: 1px;
    margin-top: 15px;
}
</style>