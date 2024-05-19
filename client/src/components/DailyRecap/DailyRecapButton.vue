<script setup>
import router from '../../router';
import { config } from '../../constants';

// VARS
const BACKEND_URL = config.url.BACKEND_URL;

// PROPS
const props = defineProps({
    dr: {
        type: Object,
        required: true,
    },
});

const { source, sourceLogo, dailyRecapId } = props.dr;

// FUNCTIONS
const fetchEventByUri = async (eventUri) => {
    var response = await fetch(`${BACKEND_URL}db/getArticlesFromEvent`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "eventUri": eventUri,
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch event for URI: ${eventUri}`);
    }
    return await response.json();
};

// Fetching dailyRecap and event details
const fetchDailyRecap = async (dailyRecapId) => {
    try {
        var response = await fetch(`${BACKEND_URL}db/getDailyRecapById`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "uuid": dailyRecapId
            })
        });

        if (response.ok) {
            const dailyRecap = await response.json();
            const eventObject = await fetchEventByUri(dailyRecap.events[0])
            return eventObject
        } else {
            throw new Error('Failed to fetch Daily Recap');
        }
    } catch (error) {
        console.error('Error fetching events:', error);
    }
};

// Redirect the user to the correct URI after finding out the first article uuid
async function renderDailyRecap(dailyRecapId) {
    const dailyrecap = await fetchDailyRecap(dailyRecapId)
    console.log(`dailyrecap ${dailyrecap}`);
    router.push({
        name: 'dailyrecap', params: {
            dailyrecapUUID: dailyRecapId,
            eventUri: dailyrecap.eventUri,
            articleUUID: dailyrecap.eventArticles[0].uuid,
        }
    });
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