import { createRouter, createWebHistory } from 'vue-router'
import { front_getArticlesFromDB, showPopup } from '../scripts/utility'
import { List, selectedArticle } from '../main'
import { config } from '../constants'

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

const BACKEND_URL = config.url.BACKEND_URL;
const FRONTEND_URL = config.url.FRONTEND_URL;

const routes = [
    {
        path: '/', component: Home,
        name: 'home',
        reload: false,
        beforeEnter: async (to, from, next) => {
            if (from && !from.fullPath.includes('/article')) {
                // Logic to execute if the user came from a URL that includes '/event'
                List.articles = []
                front_getArticlesFromDB()
                    .then(response => {
                        const articles = response
                        for (const article of articles) {
                            List.articles.push(article)
                        }
                    })
            } else {
                // Logic to execute if the user did not come from a URL that includes '/event'
                console.log('User did not come from an event URL');
            }
            next(); // Continue with the navigation
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
                var article = selectedArticle.value
                /* 
                If there is no article passed throgh 'selectedArticle' search in DB.
                This is for when the user refreshes the page when an article is open
                */
                if (!article) {
                    const response = await front_getArticlesFromDB({ uuid: to.params.uuid }, undefined, undefined, undefined, 1);
                    article = response[0];
                }
                // If after the db fetch there is an article, send it to the ArticleContent component
                if (article) {
                    to.params.article = article;
                    next();
                }
                // Else redirect to '/404' route
                else {
                    // Article not found, redirect or handle error
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
                } else { // Else redirect to '/404' route
                    // Article not found, redirect or handle error
                    next('/404');
                }
            } catch (error) {
                console.error(`Error fetching article:`, error);
                next('/error');
            }
        }
    },
    {
        path: '/event/:eventUri', component: Home, props: false,
        beforeEnter: async (to, from) => {
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
            additional: Filter,
            backdrop: Backdrop,
        },
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
                const searchArticles = await response.json()
                List.infiniteScrollCallCount = 0
                List.filterType.source = 'All'
                List.filterType.genre = 'All'
                List.filterType.searchQuery = to.query.searchQuery
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
        meta: {
            enterClass: "slide-in-bottom",
            leaveClass: "slide-out-bottom",
        }
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
        path: '/account/privacy-policy',
        component: ListItem,
        children: [
            { path: '', component: PrivacyPolicy }
        ]
    },
    {
        path: '/dailyrecap/:uuid/',
        name: 'dailyrecap',
        component: DailyRecapPage,
        props: true, // This will automatically pass route params as props
        // beforeEnter: async (to, from, next) => {
        //     try {
        //         to.params.uuid = uuid;
        //         next();
        //     } catch (error) {
        //         showPopup(2, `Couldn't load Daily Recap, try again later`,)
        //         console.log(error)
        //         router.push('/')
        //     }
        // }
    },
    {
        path: '/:catchAll(.*)', component: NotFound
    },
    {
        // FUTURE CHANGE: create a view for an article not found
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

export default router