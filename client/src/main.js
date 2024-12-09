import './global.css';
import { ref, reactive, createApp, watch } from 'vue';
import { config } from './constants'
import App from './App.vue';
import router from './router';
import { getAuthToken } from './scripts/utility';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { PushNotifications } from '@capacitor/push-notifications';
import { firebaseApp } from './firbase';

const FRONTEND_URL = config.url.FRONTEND_URL
const BACKEND_URL = config.url.BACKEND_URL

const app = createApp(App)
// ----- RESET LOCAL STORAGE -----
localStorage.setItem('genres', JSON.stringify([]))
localStorage.setItem('sources', JSON.stringify([]))

// onMounted(() => {
try {
  GoogleAuth.initialize();
  console.log('Google Auth Initialized');
} catch (error) {
  console.error('Faile to Initialize Google Auth', error)
}
// });

// ----- GLOBAL VARIABLES -----
// FUTURE CHANGE: watch List and remove duplicate articles (using url)
export const List = reactive({
  loading: false,
  infiniteScrollCallCount: 0,
  articles: [],
})

export const Filter = reactive({
  isVisible: false,
})

// ----- GET ALL SOURCES FROM DB -----
export const Sources = reactive({ list: [] })
const allSourcesInLocalStorage = JSON.parse(localStorage.getItem('allSources'));
const now = new Date();
const sourcesLastUpdate = allSourcesInLocalStorage?.lastUpdate || new Date("01/01/2000");
const sourcesDiffInDays = (now - sourcesLastUpdate) / (24 * 60 * 60 * 1000);

// If there are values in localStorage and lastUpdate was less than 1 day ago
if (allSourcesInLocalStorage) {
  const allSources = allSourcesInLocalStorage?.sources || [];
  Sources.list = allSources
}
// If there are no values in localStorage or lastUpdate was more than 1 day ago
else if (!allSourcesInLocalStorage || sourcesDiffInDays > 1) {
  fetch(`${BACKEND_URL}db/getAllSources`)
    .then(response => response.json())
    .then(response => {
      localStorage.setItem('allSources', JSON.stringify({ lastUpdate: now, sources: response }));
      Sources.list = response
    })
    .catch(error => {
      console.error('Error fetching sources in main.js', error)
    })
}

export const Genres = reactive({ list: [] })
const allGenresInLocalStorage = JSON.parse(localStorage.getItem('allGenres'));
const genresLastUpdate = allGenresInLocalStorage?.lastUpdate || new Date('01/01/2000');
const genresDiffInDays = (now - genresLastUpdate) / (24 * 60 * 60 * 1000);

// If there are values in localStorage and lastUpdate was less than 1 day ago
if (allSourcesInLocalStorage) {
  const allGenres = allGenresInLocalStorage?.sources || [];
  Genres.list = allGenres;
}
// If there are no values in localStorage or lastUpdate was more than 1 day ago
else if (!allSourcesInLocalStorage || genresDiffInDays > 1) {
  fetch(`${BACKEND_URL}db/getAllGenres`)
    .then(response => response.json())
    .then(response => {
      localStorage.setItem('allGenres', JSON.stringify({ lastUpdate: now, sources: response }));
      Genres.list = response
    })
    .catch(error => {
      console.error('Error fetching genres in main.js', error)
    })
}

// Get loggin user information from DB. If no user / fault token is found return null
async function getUser() {
  var authToken = await getAuthToken();
  if (authToken) {
    var response = await fetch(`${BACKEND_URL}user`, {
      method: 'GET',
      headers: {
        "Content-type": "application/json",
        "Authorization": `Bearer ${authToken}`
      }
    });

    // Check if the response is forbidden (status 403)
    if (response.status === 403) {
      console.error("User doesnt exist");
      // Handle the forbidden case, e.g., return an error message or redirect the user
      return null; // Stop further execution if needed
    }
    else if (response.status === 404) {
      localStorage.removeItem('authToken');
      return null;
    }
    else {
      const userObject = await response.json();
      return userObject.user;
    }
  }
  else {
    return null;
  }
}

export const userProfile = reactive({ user: null }); // Empty user on setup

// Fetch the user and assign the result to the reactive userProfile
getUser().then(user => {
  userProfile.user = user; // Update userProfile with fetched user data
});

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

// Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

//https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt
export const showPWA = ref(false)
export const installPrompt = ref(null)

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault()
  installPrompt.value = event
  showPWA.value = true
});

/* Android App Notifications */
export async function registerPushNotificationsIfNeeded() {
  // Check if permission is already granted
  const permissionStatus = await PushNotifications.checkPermissions();

  // If permission has not been granted, prompt the user
  if (permissionStatus.receive !== 'granted') {
    const permissionRequest = await PushNotifications.requestPermissions();

    if (permissionRequest.receive === 'granted') {
      // Permission granted, proceed to register for notifications
      await registerPushNotifications();
    } else {
      console.log('Push notifications permission denied');
    }
  } else {
    // Permission was already granted
    await registerPushNotifications();
  }
}

async function registerPushNotifications() {
  try {
    // Register for push notifications
    await PushNotifications.register();

    // Listen for the registration event to get the FCM token
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ', token.value);
      const fcmToken = token.value;
      const userid = userProfile.user.googleId
      // Send the token to your backend to store with the user's account
      try {
        const response = await fetch(`${BACKEND_URL}db/saveNotificationToken`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Include any authentication headers if necessary
          },
          body: JSON.stringify({ fcmToken, userid }),
        });
        if (response.status == 200) {
          console.log('Token saved to backend successfully.');
          return { success: true };
        } else {
          console.log('Failed to save token')
        }
      } catch (error) {
        console.error('Something went wrong:', error);
      }
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Push registration error: ', error);
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received: ', notification);
      // Handle the notification here (e.g., show a local notification)
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed: ', notification);
      // Handle the action (e.g., navigate to a specific screen)
    });
  } catch (error) {
    console.error('Failed to register push notifications:', error);
  }
}

// async function saveUserNotificationToken(token, userid) {
//   try {
//     await fetch(`${BACKEND_URL}db/saveNotificationToken`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         // Include any authentication headers if necessary
//       },
//       body: JSON.stringify({ token, userid }),
//     });
//     console.log('Token saved to backend successfully.');
//     return { success: true };
//   } catch (error) {
//     console.error('Failed to save token:', error);
//     return { success: false };
//   }
// }

app.use(router);
app.mount('#app');