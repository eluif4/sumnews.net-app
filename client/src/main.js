import './global.css';
import { ref, reactive, createApp, watch } from 'vue';
import { config } from './constants'

import App from './App.vue';
import router from './router'

const FRONTEND_URL = config.url.FRONTEND_URL
const BACKEND_URL = config.url.BACKEND_URL

const app = createApp(App)

// ----- GLOBAL VARIABLES -----
export const List = reactive({
  loading: false,
  infiniteScrollCallCount: 0,
  filterType: {
    source: "All",
    genre: "All",
    searchQuery: '',
  },
  articles: [],
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

// ----- ALLOW FOR QUICK ARTICLE INFORMATION RETRIEVAL WHEN CLICKING ON AN ARTICLE -----
export const selectedArticle = ref(null);

app.use(router)
app.mount('#app');