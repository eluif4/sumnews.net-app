import { createRouter, createWebHistory } from 'vue-router'
import { front_getArticlesFromDB, showPopup, fetchFeed } from '../scripts/utility'
import { List, userProfile } from '../main'
import { config } from '../constants'
import { fetchUserFeed, getAuthToken } from '../scripts/utility'

import Home from '../views/Home.vue'
import AccountPage from '../views/AccountPage.vue'
import ListItem from '../components/AccountPage/ListItem.vue'
import AboutUs from '../components/AccountPage/Pages/AboutUs.vue'
import ContactUs from '../components/AccountPage/Pages/ContactUs.vue'
import ReportBugs from '../components/AccountPage/Pages/ReportBugs.vue'
import Disclaimer from '../components/AccountPage/Pages/Disclaimer.vue'
import TermsAndConditions from '../components/AccountPage/Pages/TermsAndConditions.vue'
import PrivacyPolicy from '../components/AccountPage/Pages/PrivacyPolicy.vue'
import NotFound from '../views/NotFoundPage.vue'
import Filter from '../components/Filter/Filter.vue'
import Backdrop from '../components/Article/Backdrop.vue'
import ArticleContent from '../components/Article/ArticleContent.vue'
import DailyRecapPage from '../views/DailyRecapPage.vue'
import Bookmarks from '../components/AccountPage/Pages/Bookmarks.vue'
import Login from '../views/Login.vue'

const BACKEND_URL = config.url.BACKEND_URL;
const FRONTEND_URL = config.url.FRONTEND_URL;

const routes = [
    {
        path: '/',
        component: Home,
        name: 'home',
        // reload: false,
        beforeEnter: async (to, from, next) => {
            if (!localStorage.getItem('hasAgreedToCookies') && !to.query.skip && !from.path.includes('login')) { 
                // If user hasnt visited the login page ( still hasnt accepted cookies ) and doesnt come from '/login' path
                next('/login');
            } else {
                console.log('accepted cookies')
                const isFromLoginPath = from.fullPath.includes('/login');
                const isFromArticlePath = from.fullPath.includes('/article');
                const isFromFilterPath = from.fullPath.includes('/filter');
                const isFromHomePath = (from.fullPath == '/');
                const isFromDailyRecapPath = (from.fullPath.includes('/dailyrecap'))
                const isFromAccountPath = (from.fullPath.includes('/account'))
                const isFromErrorPage = (from.fullPath.includes('/404')) || (from.fullPath.includes('/error'));
                const isFromEventPage = (from.fullPath.includes('/event'));
                const sourcesInLocalStorage = localStorage.getItem('sources');
                const genresInLocalStorage = localStorage.getItem('genres');

                // const isLocalStorageEmpty = (sourcesInLocalStorage === null || JSON.parse(sourcesInLocalStorage).length === 0) &&
                //     (genresInLocalStorage === null || JSON.parse(genresInLocalStorage).length === 0);

                if (
                    (isFromArticlePath && List.articles.length === 0) ||
                    (isFromFilterPath) ||
                    (isFromHomePath && List.articles.length === 0) ||
                    (isFromAccountPath) ||
                    (isFromDailyRecapPath) ||
                    (isFromErrorPage && List.articles.length === 0) ||
                    (isFromEventPage && List.articles.length === 0) ||
                    (isFromLoginPath)
                ) {
                    List.articles = [];
                    var token = await getAuthToken();
                    if (token) {
                        await fetchUserFeed()
                    }
                    else {
                        await fetchFeed()
                    }
                }
                else {
                    console.log('navigation to home page through else')
                    // Logic to execute if use is coming from other paths into home
                }
                next(); // Continue with the navigation
            }
        }
    },
    {
        path: '/article/:uuid',
        name: 'article',
        meta: {
            enterClass: "slide-in-bottom",
            leaveClass: "slide-out-bottom",
        },
        components: {
            default: Home,
            additional: ArticleContent,
            backdrop: Backdrop,
        },
        props: {
            additional: true,
        },
        beforeEnter: async (to, from, next) => {
            try {
                var article = List.articles[to.query.index];
                if (!article) {
                    const response = await front_getArticlesFromDB({ uuid: to.params.uuid }, undefined, undefined, undefined, 1);
                    article = response[0];
                    if (List.articles.length == 0) {
                        var token = await getAuthToken();
                        if (token) {
                            await fetchUserFeed()
                        }
                        else {
                            await fetchFeed()
                        }
                    }
                }
                if (article) {
                    to.params.article = article;
                    next();
                }
                else {
                    next('/404');
                }
            } catch (error) {
                console.error(`Error fetching article:`, error);
                next('/error');
            }
        },
    },
    {
        path: '/article/:uuid',
        name: 'eventArticles',
        meta: {
            enterClass: "slide-in-bottom",
            leaveClass: "slide-out-bottom",
        },
        components: {
            default: Home,
            additional: ArticleContent,
            backdrop: Backdrop,
        },
        props: {
            additional: true,
        },
        beforeEnter: async (to, from, next) => {
            try {
                const response = await front_getArticlesFromDB({ uuid: to.params.uuid }, undefined, undefined, undefined, 1);
                const article = response[0];
                if (article) {
                    to.params.article = article;
                    next();
                } else {
                    next('/404');
                }
            } catch (error) {
                console.error(`Error fetching article:`, error);
                next('/error');
            }
        }
    },
    {
        path: '/event/:eventUri',
        name: 'fullCoverage',
        component: Home,
        props: false,
        beforeEnter: async (to, from) => {
            if (!from.path.includes('/article') || List.articles.length === 0) {
                try {
                    List.articles = [];
                    const scrollElement = document.getElementById('article-stack');
                    if (scrollElement != null) {
                        scrollElement.scrollTo({ top: 0 })
                    }
                    fetch(`${BACKEND_URL}db/eventArticles?eventUri=${to.params.eventUri}`)
                        .then(response => response.json())
                        .then(data => {
                            List.articles = data;
                        })
                        .catch(error => {
                            console.error('Error:', error);
                        });
                } catch (error) {
                    console.error(`Something went wrong with the event page`, error)
                }
            }
        }
    },
    {
        path: '/filter',
        name: 'filter',
        meta: {
            enterClass: "slide-in-bottom",
            leaveClass: "slide-out-bottom",
        },
        components: {
            default: Home,
            // additional: Filter,
            // backdrop: Backdrop,
        },
        // Refer to the beforeEach at the bottom of the page
        // beforeEnter: async (to, from, next) => {
        //     // If filtering
        //     console.log('beforeEnter', to.query)
        //     if ((to.query.sources || to.query.genres)) {
        //         List.articles = [];
        //         var filter = {};

        //         const sourcesArray = to.query.sources?.split(',');
        //         const genresArray = to.query.genres?.split(',');

        //         // Initialize an empty array for `$or` conditions
        //         const orConditions = [];

        //         // Add the entire `source` condition if `sourcesArray` has at least one value
        //         if (sourcesArray?.length > 0) {
        //             orConditions.push({ "source": { "$in": sourcesArray } });
        //         }

        //         // Add the entire `genre` condition if `genresArray` has at least one value
        //         if (genresArray?.length > 0) {
        //             orConditions.push({ "genre": { "$in": genresArray } });
        //         }

        //         // Only include `$or` in the filter if there are conditions
        //         if (orConditions.length > 0) {
        //             filter = { $or: orConditions };
        //         }

        //         var response = await front_getArticlesFromDB(filter) // , { uuid: 1, title: 1, imageUrl: 1};
        //         List.articles = response;
        //         // document.getElementById('article-stack').scrollTop = 0;
        //     } else {
        //         console.log('No query params were provided')
        //         next({ name: 'home' });
        //     }
        //     //     if (List.articles.length == 0) {
        //     //         var token = await getAuthToken();
        //     //         if (token) {
        //     //             await fetchUserFeed()
        //     //         }
        //     //         else {
        //     //             await fetchFeed()
        //     //         }
        //     //     }
        //     next();
        // }
    },
    {
        path: '/search',
        name: 'search',
        component: Home,
        props: (route) => ({ searchQuery: route.query.searchQuery }),
        beforeEnter: async (to, from) => {
            const response = await fetch(`${BACKEND_URL}db/search?search_query=${to.query.searchQuery}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
            })

            if (response.ok) {
                const searchArticles = await response.json();
                List.infiniteScrollCallCount = 0;
                List.articles = searchArticles;
            }
            else {
                console.error('Failed to fetch data:', response.statusText)
                showPopup(2, 'Internal Error',)
            }
        },
    },
    {
        path: '/account',
        name: 'account',
        component: AccountPage,
        // meta: {
        //     enterClass: "slide-in-bottom",
        //     leaveClass: "slide-out-bottom",
        // }
    },
    {
        path: '/account/about',
        component: ListItem,

        children: [
            { path: '', component: AboutUs },
        ]
    },
    {
        path: '/account/contact-us',
        component: ListItem,
        children: [
            { path: '', component: ContactUs }
        ]
    },
    {
        path: '/account/disclaimer',
        component: ListItem,
        children: [
            { path: '', component: Disclaimer },
        ]
    },
    {
        path: '/account/report-bugs',
        component: ListItem,
        children: [
            { path: '', component: ReportBugs }
        ]
    },
    {
        path: '/account/terms-&-conditions',
        component: ListItem,
        children: [
            { path: '', component: TermsAndConditions }
        ]
    },
    {
        path: '/terms-&-conditions',
        component: ListItem,
        children: [
            { path: '', component: TermsAndConditions }
        ]
    },
    {
        path: '/account/privacy-policy',
        component: ListItem,
        children: [
            { path: '', component: PrivacyPolicy }
        ]
    },
    {
        path: '/privacy-policy',
        component: ListItem,
        children: [
            { path: '', component: PrivacyPolicy }
        ]
    },
    {
        path: '/account/bookmarks',
        component: ListItem,
        children: [
            { path: '', component: Bookmarks },
        ],
        beforeEnter: async (to, from, next) => {
            // If the user isn't logged in, redirect them to the /account path
            if (!userProfile.user) {
                next('/account');
            } else {
                next();  // Proceed to the route if the user is logged in
            }
        }
    },
    {
        path: '/dailyrecap/:dailyrecapUUID/:drEvent',
        name: 'dailyrecap',
        component: DailyRecapPage,
        props: route => ({
            dailyrecapUUID: route.params.dailyrecapUUID,
            drEvent: route.params.drEvent
        })
    },
    {
        path: '/login',
        name: 'login',
        component: Login,
    },
    {
        path: '/:catchAll(.*)', component: NotFound
    },
    {
        path: '/404', component: NotFound
    },
    {
        path: '/error', component: NotFound
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) { // <- remove overflow: hidden from somewhere for this to work
        return { top: 0 }
    }
})

// Create an array to store route history
const routeHistory = [];

// Navigation guard to track history
router.beforeEach(async (to, from, next) => {
    if (to.name == 'filter') {
        // If navigating to /filter route ( usually after a filtered article route /article)
        if ((to.query.sources || to.query.genres) && !from.path.includes('article')) {
            List.articles = [];
            var filter = {};

            const sourcesArray = to.query.sources?.split(',');
            const genresArray = to.query.genres?.split(',');

            // Initialize an empty array for `$or` conditions
            const orConditions = [];

            // Add the entire `source` condition if `sourcesArray` has at least one value
            if (sourcesArray?.length > 0) {
                orConditions.push({ "source": { "$in": sourcesArray } });
            }

            // Add the entire `genre` condition if `genresArray` has at least one value
            if (genresArray?.length > 0) {
                orConditions.push({ "genre": { "$in": genresArray } });
            }

            // Only include `$or` in the filter if there are conditions
            if (orConditions.length > 0) {
                filter = { $or: orConditions };
            }

            var response = await front_getArticlesFromDB(filter) // , { uuid: 1, title: 1, imageUrl: 1};
            List.articles = response;
            // document.getElementById('article-stack').scrollTop = 0;
        } else if (from.path.includes('article')) {
            next();
        } else {
            console.log('No query params were provided')
            next({ name: 'home' });
        }
        next();
    }


    routeHistory.push(from.fullPath);
    next();
});

export { routeHistory };
export default router