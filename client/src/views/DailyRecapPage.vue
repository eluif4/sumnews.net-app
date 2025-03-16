<script setup>
import { ref, onMounted, computed, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { config } from '../constants';
import DailyRecapItem from '../components/DailyRecap/DailyRecapItem.vue';
import DailyRecapItemSkeleton from '../components/DailyRecap/DailyRecapItemSkeleton.vue';
import { goBack, showPopup } from '../scripts/utility';

// Constants
// Base URL for backend API calls
const BACKEND_URL = config.url.BACKEND_URL;

// Router Setup
// Access to current route and router instance
const route = useRoute();
const router = useRouter();

// Reactive State
// Current daily recap UUID from route params
const dailyrecapUUID = ref(route.params.dailyrecapUUID);
// Current daily recap event ID from route params
const drEvent = ref(route.params.drEvent);
// Set of visited daily recap UUIDs for O(1) lookup
const visitedDailyRecaps = ref(new Set([dailyrecapUUID.value]));
// Flag indicating if daily recap data fetch is complete
const isDailyRecapFetchFinished = ref(false);
// Array of daily recap objects (prev, current, next)
const dailyrecaps = ref([]);
// Index of current daily recap in the array (0-2)
const currentDailyRecapIndex = ref(0);
// Index of current event within current daily recap
const currentDrEventIndex = ref(0);
// Reference to carousel DOM element
const carouselRef = ref(null);

// Computed Properties
// Dynamic gap between event indicators based on article count
const dynamicGap = computed(() => {
  const articleCount = dailyrecaps.value[currentDailyRecapIndex.value]?.drEvents?.length ?? 0;
  return Math.max(3, 10 - (articleCount - 1)); // Min 3px, max 10px
});

// API Service
// Encapsulates all API-related operations
const apiService = {
  // Fetch a single daily recap by UUID
  async fetchDailyRecap(uuid) {
    try {
      const response = await fetch(`${BACKEND_URL}db/dailyrecap/${uuid}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const [data] = await response.json();
      return data ?? null;
    } catch (error) {
      console.error(`Failed to fetch daily recap ${uuid}:`, error);
      return null;
    }
  },

  // Fetch all daily recap buttons
  async fetchDailyRecapButtons() {
    const response = await fetch(`${BACKEND_URL}db/getDailyRecapButtons`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  }
};

// Local Storage Service
// Manages localStorage operations
const storageService = {
  // Get daily recaps from localStorage with fallback
  getDailyRecaps() {
    try {
      return JSON.parse(localStorage.getItem('dailyRecaps')) ?? {};
    } catch (error) {
      console.error('Failed to parse daily recaps from storage:', error);
      return {};
    }
  },

  // Save daily recaps to localStorage
  setDailyRecaps(data) {
    try {
      localStorage.setItem('dailyRecaps', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save daily recaps to storage:', error);
    }
  },

  // Update visited status and reorder buttons
  updateVisitedButtons(visitedIds) {
    const { dailyRecapButtons = [], lastUpdate } = this.getDailyRecaps();
    const updatedButtons = dailyRecapButtons
      .map(button => ({
        ...button,
        wasVisited: visitedIds.has(button.id) || button.wasVisited
      }))
      .sort((a, b) => (a.wasVisited === b.wasVisited ? 0 : a.wasVisited ? 1 : -1));
    
    this.setDailyRecaps({ lastUpdate, dailyRecapButtons: updatedButtons });
  }
};

// Utility Functions
// Generate UTC 18:05 timestamp for storage
const getUTC1805 = () => new Date(Date.UTC(
  new Date().getUTCFullYear(),
  new Date().getUTCMonth(),
  new Date().getUTCDate(),
  18,
  5
));

// Update daily recaps data
const updateDailyRecaps = async () => {
  isDailyRecapFetchFinished.value = false;
  let dailyRecapButtons = storageService.getDailyRecaps().dailyRecapButtons;

  // Fetch buttons if not in storage
  if (!dailyRecapButtons?.length) {
    try {
      dailyRecapButtons = await apiService.fetchDailyRecapButtons();
      storageService.setDailyRecaps({
        lastUpdate: getUTC1805(),
        dailyRecapButtons
      });
    } catch (error) {
      console.error('Failed to fetch daily recap buttons:', error);
      showPopup(2, 'Error fetching Daily Recap data');
      router.push({ name: 'home' });
      return;
    }
  }

  const currentIndex = dailyRecapButtons.findIndex(recap => recap.id === dailyrecapUUID.value);
  if (currentIndex === -1) {
    console.error(`Daily recap ${dailyrecapUUID.value} not found in buttons`);
    return;
  }

  // Fetch surrounding daily recaps
  const fetchPromises = [
    currentIndex > 0 ? apiService.fetchDailyRecap(dailyRecapButtons[currentIndex - 1].id) : null,
    apiService.fetchDailyRecap(dailyRecapButtons[currentIndex].id),
    currentIndex < dailyRecapButtons.length - 1 ? apiService.fetchDailyRecap(dailyRecapButtons[currentIndex + 1].id) : null
  ];

  dailyrecaps.value = (await Promise.all(fetchPromises)).filter(Boolean);
  currentDailyRecapIndex.value = dailyrecaps.value.findIndex(d => d?.id === dailyrecapUUID.value) || 1;
  currentDrEventIndex.value = dailyrecaps.value[currentDailyRecapIndex.value]?.drEvents.findIndex(e => e.id === drEvent.value) ?? 0;
  isDailyRecapFetchFinished.value = true;
};

// Event Handlers
// Navigate between events within current daily recap
const handleNavigation = (direction) => {
  const currentEvents = dailyrecaps.value[currentDailyRecapIndex.value]?.drEvents ?? [];
  if (!currentEvents.length) return;

  if (direction === 'prev' && currentDrEventIndex.value > 0) {
    currentDrEventIndex.value--;
  } else if (direction === 'next' && currentDrEventIndex.value < currentEvents.length - 1) {
    currentDrEventIndex.value++;
  } else {
    return; // No navigation needed
  }

  router.push({
    name: 'dailyrecap',
    params: {
      dailyrecapUUID: dailyrecapUUID.value,
      drEvent: currentEvents[currentDrEventIndex.value].id
    }
  });
};

// Handle carousel slide events
const handleSlide = debounce(() => {
  if (!carouselRef.value) return;

  const scrollPosition = carouselRef.value.scrollLeft;
  const itemWidth = carouselRef.value.offsetWidth;
  const newIndex = Math.round(scrollPosition / itemWidth);

  if (newIndex !== currentDailyRecapIndex.value && dailyrecaps.value[newIndex]) {
    currentDailyRecapIndex.value = newIndex;
    currentDrEventIndex.value = 0;
    router.push({
      name: 'dailyrecap',
      params: {
        dailyrecapUUID: dailyrecaps.value[newIndex].id,
        drEvent: dailyrecaps.value[newIndex].drEvents[0].id
      }
    });
  }
}, 100);

// Handle click navigation
const handleClick = (e) => {
  const screenMidpoint = window.innerWidth / 2;
  handleNavigation(e.clientX < screenMidpoint ? 'prev' : 'next');
};

// Simple debounce utility
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Lifecycle Hooks
onMounted(async () => {
  await updateDailyRecaps();
  
  if (carouselRef.value) {
    carouselRef.value.addEventListener('scroll', handleSlide);
    const scrollPercentage = currentDailyRecapIndex.value / (dailyrecaps.value.length || 1);
    carouselRef.value.scrollTo({
      left: scrollPercentage * carouselRef.value.scrollWidth,
      behavior: 'instant'
    });
  }
});

onUnmounted(() => {
  carouselRef.value?.removeEventListener('scroll', handleSlide);
});

// Route Watchers
// Watch for UUID changes in route
watch(() => route.params.dailyrecapUUID, async (newUUID) => {
  if (newUUID !== dailyrecapUUID.value) {
    dailyrecapUUID.value = newUUID;
    visitedDailyRecaps.value.add(newUUID);
    await updateDailyRecaps();
  }
});

// Watch for event ID changes in route
watch(() => route.params.drEvent, (newEvent) => {
  if (newEvent !== drEvent.value) {
    drEvent.value = newEvent;
    currentDrEventIndex.value = dailyrecaps.value[currentDailyRecapIndex.value]
      ?.drEvents.findIndex(event => event.id === newEvent) ?? 0;
  }
});
</script>

<template>
  <div class="dailyrecap-container">
    <!-- Header with title and close button -->
    <header class="info-header">
      <div class="dailyrecap-header">
        <p>Daily Recap</p>
        <button 
          class="close-btn" 
          @click="storageService.updateVisitedButtons(visitedDailyRecaps); goBack()"
          aria-label="Close daily recap"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
            <path d="M15.2638 14.4237..." fill="white" />
          </svg>
        </button>
      </div>
      
      <!-- Event progress indicators -->
      <div class="event-indicators" :style="{ gap: `${dynamicGap}px` }">
        <div
          v-if="isDailyRecapFetchFinished"
          v-for="(_, index) in dailyrecaps[currentDailyRecapIndex]?.drEvents"
          :key="index"
          class="bubble"
          :class="{ active: index <= currentDrEventIndex }"
        />
      </div>
    </header>

    <!-- Carousel of daily recap items -->
    <section
      ref="carouselRef"
      class="dailyrecap-list"
      @click="handleClick"
      aria-label="Daily recap carousel"
    >
      <template v-if="isDailyRecapFetchFinished">
        <article
          v-for="dailyrecap in dailyrecaps"
          :key="dailyrecap.id"
          class="dailyrecap carousel-item"
        >
          <DailyRecapItem :dailyrecap="dailyrecap" />
        </article>
      </template>
      <article v-else class="dailyrecap carousel-item">
        <DailyRecapItemSkeleton />
      </article>
    </section>
  </div>
</template>

<style scoped>
.dailyrecap-container {
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.info-header {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 10px;
  color: white;
  background: linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 90%);
  z-index: 2;
}

.dailyrecap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.2s ease;
}

.close-btn:hover {
  opacity: 0.8;
}

.event-indicators {
  display: flex;
  justify-content: center;
  align-items: center;
}

.bubble {
  flex: 1;
  height: 6px;
  background-color: white;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.bubble.active {
  background-color: var(--main-color);
}

.dailyrecap-list {
  height: 100%;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  background-color: #000;
  display: flex;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
}

.carousel-item {
  flex: 0 0 100%;
  height: 100%;
  scroll-snap-align: center;
  background: #404040;
  border-radius: 25px 25px 0 0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

/* Hide scrollbar but keep functionality */
.dailyrecap-list::-webkit-scrollbar {
  display: none;
}

.dailyrecap-list {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>