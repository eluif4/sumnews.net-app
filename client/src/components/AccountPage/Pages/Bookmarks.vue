<script setup>
import { ref, onMounted } from 'vue';
import ArticleInstance from '../../Article/ArticleInstance.vue';
import { config } from '../../../constants';
import { bookmarkAction } from '../../../scripts/actions';
import ArticleSkeleton from '../../Article/ArticleSkeleton.vue';

const BACKEND_URL = config.url.BACKEND_URL;
const userBookmarks = ref([]); // Reactive variable to store bookmarks
const isLoading = ref(false);

onMounted(async () => {
    try {
        isLoading.value = true;
        const response = await fetch(`${BACKEND_URL}user/bookmarks`, {
            method: 'GET',
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('authToken')}`,
                "Content-Type": "application/json"
            }
        });
        if (response.ok) {
            const data = await response.json();
            isLoading.value = false;
            userBookmarks.value = data.bookmarks; // Set the bookmarks in the reactive ref
        } else {
            isLoading.value = false;
            console.error('Failed to fetch bookmarks:', response.status);
        }
    } catch (error) {
        isLoading.value = false;
        console.error('Error fetching bookmarks:', error);
    }
});
</script>

<template>
    <div v-if="userBookmarks.length > 0" class="populated-bookmarks">
        <p>You have {{ userBookmarks.length }} article{{ userBookmarks.length > 1 ? "s" : "" }} bookmarked</p>
        <!-- Loop through bookmarks and display -->
        <router-link v-for="(article, index) in userBookmarks" :key="article.uuid" style="min-width: 100%"
            :to="{ name: 'article', params: { uuid: article.uuid }, query: { index: index } }">
            <ArticleInstance :article="article" />
        </router-link>
    </div>

    <div v-else-if="isLoading">
        <div v-for="n in 10">
            <ArticleSkeleton></ArticleSkeleton>
        </div>
    </div>

    <!-- Show empty message if there are no bookmarks -->
    <div v-else class="empty-bookmarks" style="color: black">
        <p class="text-xl">You still haven't bookmarked any articles</p>
        <p class="text-base">Click on the bookmark icon on an article to save it for further reading</p>
    </div>
</template>

<style scoped>
.empty-bookmarks {
    display: flex;
    flex-direction: column;
    background-color: var(--main-color);
    align-items: center;
    text-align: center;
    padding: 10px;
    gap: 20px;
    border-radius: var(--border-radius);
}

.svg {
    display: flex;
    justify-content: center;
}

.text-xl {
    color: black;
}
</style>