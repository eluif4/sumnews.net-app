import './global.css';
import { ref, reactive, createApp, watch } from 'vue';
import { config } from './constants'

import App from './App.vue';
import router from './router'

const FRONTEND_URL = config.url.FRONTEND_URL
const BACKEND_URL = config.url.BACKEND_URL

const app = createApp(App)
// ----- RESET LOCAL STORAGE -----
localStorage.setItem('genres', JSON.stringify([]))
localStorage.setItem('sources', JSON.stringify([]))

// ----- GLOBAL VARIABLES -----
// FUTURE CHANGE: watch List and remove duplicate articles (using url)
export const List = reactive({
  loading: false,
  infiniteScrollCallCount: 0,
  articles: [],
})

watch(List.articles, (newArticleList, oldArticlList) => {
  for (const article of newArticleList) {
    // check if article already exists
  }
})

// ----- GET ALL SOURCES FROM DB -----
export const Sources = reactive({ list: [] })
fetch(`${BACKEND_URL}db/getAllSources`)
  .then(response => response.json())
  .then(response => {
    Sources.list = response
  })
  .catch(error => {
    console.error('Error fetching sources in main.js', error)
  })

export const Genres = reactive({ list: [] })
fetch(`${BACKEND_URL}db/getAllGenres`)
  .then(response => response.json())
  .then(response => {
    Genres.list = response
  })
  .catch(error => {
    console.error('Error fetching genres in main.js', error)
  })

// ----- POPUP PROPERTIES -----
export const PopupAttributes = reactive({
  show: false,
  msg: '',
  showTime: 5,
  methodValue: -1,
  /*
  -1 <- Not declared
  0 <- Successful web share api
  1 <- Successfully copied to clipboard
  2 <- any error
  */
})

// ----- SERVICE WORKER -----
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./client/service-worker.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }).catch(error => {
      console.log('ServiceWorker registration failed: ', error);
    });
  });
}

app.use(router);
app.mount('#app');