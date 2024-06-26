<template>
    <div class=" flex flex-col gap-4 w-full h-full">
        <div class="skeleton h-60 w-full image-container"></div>
        <div class="content-container" id="content-container">
            <div class="genre-list skeleton w-32 h-8"></div>
            <div class="article-title skeleton w-full h-16"></div>
            <div class="skeleton w-48 h-16"></div>
            <p class="first-paragraph skeleton w-full h-48"></p>
            <p class="second-paragraph skeleton w-full h-32"></p>
        </div>
    </div>
</template>

<style scoped>
.article-instance {
    width: 100%;
    height: 92%;
    /* margin: 1% 0; */
    border-radius: var(--border-radius);
    /* margin-bottom: 5%; */
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

.item-container {
    display: flex;
    flex-direction: column;
    background: #FFF;
    margin: 10px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    touch-action: pan-y;
}

.image-container {
    width: 100%;
    height: 200px;
    overflow: hidden;
}

.article-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.content-container {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.genre-list {
    display: flex;
    flex-wrap: wrap;
    /* margin-bottom: 10px; */
}

.genre {
    background: #f0f0f0;
    border-radius: 5px;
    padding: 5px 10px;
    margin-right: 5px;
    margin-bottom: 5px;
}

.article-title {
    font-size: 20px;
    font-weight: bold;
    /* margin-bottom: 10px; */
}

.authorsAndDate {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
}

.authors {
    font-weight: bold;
}

.source-date {
    font-size: 14px;
    color: #999;
}

.summarized-content {
    margin-bottom: 20px;
}

.original-article-link {
    text-decoration: none;
    color: #FE6D6D;
    display: flex;
    align-items: center;
}

.original-article-container {
    display: flex;
    align-items: center;
    font-weight: bold;
}

.original-article-container svg {
    margin-left: 5px;
}

.squote {
    color: black !important;
    background: #fff2cc;
    padding: 0 5px;
}

.quote {
    color: black !important;
    background: #f2f2f2;
    padding: 0 5px;
}
</style>
