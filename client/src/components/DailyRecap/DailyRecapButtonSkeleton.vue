<template>
    <div class="flex flex-col gap-4 w-full">
        <div class="skeleton h-32 w-full article-instance"></div>
    </div>
</template>

<style scoped>
.article-instance {
    width: 60px;
    height: 60px;
    margin: 1% 0;
    border-radius: var(--border-radius);
    margin-bottom: 5%;
    background-color: rgb(146 146 146 / 30%)
}

.skeleton {
    background-image: linear-gradient(105deg,
            transparent 0%,
            transparent 40%,
            var(--error-color) 50%,
            transparent 60%,
            transparent 100%)
}
</style>