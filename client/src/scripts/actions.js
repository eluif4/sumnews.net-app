import router from '../router'
import { config } from '../constants';
import { goBack, showPopup } from './utility';
import { PopupAttributes } from '../main';

const FRONTEND_URL = config.url.FRONTEND_URL
const BACKEND_URL = config.url.BACKEND_URL

// SVGs
const SHARE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M22 7H14C12.182 7 11.087 7.892 10.68 8.3C10.555 8.427 10.492 8.49 10.49 8.49C10.49 8.492 10.427 8.555 10.3 8.68C9.892 9.087 9 10.182 9 12V15M22 7L17 2M22 7L17 12" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.465 20.535C4.93 22 7.287 22 12.003 22C16.718 22 19.076 22 20.54 20.535C21.782 19.294 21.971 17.412 22 13.998M3.465 20.535C2 19.07 2 16.713 2 11.997M3.465 20.535C4.929 22 7.286 22 12 22C16.714 22 19.071 22 20.535 20.535C21.776 19.295 21.965 17.413 21.995 13.999M3.465 20.535C2 19.071 2 16.714 2 12M3.465 3.46C4.706 2.218 6.588 2.029 10.002 2M2.055 8C2.165 5.807 2.491 4.438 3.465 3.464C4.705 2.224 6.587 2.034 10 2.005" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const BOOKMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 11.098V16.091C3 19.187 3 20.736 3.734 21.412C4.084 21.735 4.526 21.938 4.997 21.992C5.984 22.105 7.137 21.085 9.442 19.046C10.462 18.145 10.971 17.694 11.56 17.576C11.85 17.516 12.15 17.516 12.44 17.576C13.03 17.694 13.539 18.145 14.558 19.046C16.863 21.085 18.016 22.105 19.003 21.991C19.473 21.938 19.916 21.735 20.266 21.412C21 20.736 21 19.188 21 16.091V11.097C21 6.809 21 4.665 19.682 3.332C18.364 2 16.242 2 12 2C7.757 2 5.636 2 4.318 3.332C3.511 4.148 3.198 5.27 3.077 7M15 6H9" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const FULLCOVERAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 14V10C3 6.229 3 4.343 4.172 3.172C5.343 2 7.229 2 11 2H13C16.771 2 18.657 2 19.828 3.172C20.482 3.825 20.771 4.7 20.898 6M21 10V14C21 17.771 21 19.657 19.828 20.828C18.657 22 16.771 22 13 22H11C7.229 22 5.343 22 4.172 20.828C3.518 20.175 3.229 19.3 3.102 18M8 14H13M8 10H9M16 10H12" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const BACKACTION_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M22.125 12C22.125 12.2984 22.0065 12.5845 21.7955 12.7955C21.5845 13.0065 21.2984 13.125 21 13.125H5.71499L9.79499 17.205C9.90552 17.308 9.99417 17.4322 10.0557 17.5702C10.1171 17.7082 10.1502 17.8572 10.1529 18.0082C10.1555 18.1593 10.1278 18.3093 10.0712 18.4494C10.0146 18.5895 9.93037 18.7167 9.82354 18.8236C9.71672 18.9304 9.58947 19.0146 9.44938 19.0712C9.3093 19.1278 9.15926 19.1556 9.0082 19.1529C8.85715 19.1502 8.70818 19.1172 8.57018 19.0557C8.43218 18.9942 8.30798 18.9055 8.20499 18.795L2.20499 12.795C1.99431 12.5841 1.87598 12.2981 1.87598 12C1.87598 11.7019 1.99431 11.416 2.20499 11.205L8.20499 5.20501C8.41825 5.00629 8.70032 4.89811 8.99177 4.90325C9.28322 4.90839 9.5613 5.02646 9.76742 5.23258C9.97354 5.4387 10.0916 5.71678 10.0967 6.00823C10.1019 6.29968 9.99371 6.58175 9.79499 6.79501L5.71499 10.875H21C21.2984 10.875 21.5845 10.9935 21.7955 11.2045C22.0065 11.4155 22.125 11.7016 22.125 12Z" fill="white"/></svg>`;
const DAILYRECAP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" viewBox="0 0 20 22" fill="none"><path d="M9.99994 13H10.0089M4.99994 21H14.9999M1.51794 9.306C1.12994 8.232 0.93594 7.695 1.01794 7.351C1.10894 6.974 1.37694 6.681 1.71894 6.583C2.03194 6.493 2.51894 6.71 3.49194 7.143C4.35194 7.525 4.78194 7.716 5.18694 7.706C5.63294 7.694 6.06094 7.516 6.40194 7.199C6.71194 6.912 6.91894 6.455 7.33394 5.541L8.24894 3.525C9.01294 1.842 9.39494 1 9.99994 1C10.6049 1 10.9869 1.842 11.7509 3.525L12.6659 5.541C13.0809 6.455 13.2889 6.912 13.5979 7.199C13.9389 7.515 14.3679 7.694 14.8129 7.706C15.2169 7.716 15.6479 7.525 16.5079 7.142C17.4819 6.71 17.9679 6.493 18.2809 6.583C18.6229 6.681 18.8909 6.974 18.9809 7.351C19.0639 7.695 18.8699 8.231 18.4809 9.306L16.8139 13.922C16.0999 15.897 15.7439 16.884 14.9969 17.442C14.2499 18 13.2849 18 11.3559 18H8.64394C6.71394 18 5.74994 18 5.00394 17.442C4.25694 16.884 3.89994 15.897 3.18594 13.922L1.51794 9.306Z" stroke="url(#paint0_linear_269_552)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><defs><linearGradient id="paint0_linear_269_552" x1="18.9999" y1="21" x2="0.999878" y2="1" gradientUnits="userSpaceOnUse"><stop stop-color="#FA0CFF"/><stop offset="1" stop-color="#00FFF0"/></linearGradient></defs></svg>`;

// Functions
export async function actionShareFunction (article) {
    if (navigator.share) {
        try {
            await navigator.share({
                title: `Check out this article on sumnews\n${article.title}`,
                text: `I found an interesting article on sumnews from ${article.source}.`,
                url: `${FRONTEND_URL}article/${article.uuid}`,
            });
        } catch (error) {
            console.error('Error sharing:', error.message);
            // showPopup(2)
        }
    } else {
        if (window.isSecureContext) {
            navigator.clipboard.writeText(`Checkout this article on sumnews\n${FRONTEND_URL}article/${article.uuid}`)
            showPopup(1, "Link copied to clipboard succesfully")
        } else {
            showPopup(2, "Oops, something went wrong...")
        }
    }
}

function bookmarkActionFunction() {
    showPopup(1, "Your article has been bookmarked succesfully")
}

function fullCoverageActionFunction(article) {
    router.push(`/event/${article.eventUri}`)
}

// ----- ACTION VARS -----
export const shareAction = {
    svg: SHARE_SVG,
    actionFunction: actionShareFunction,
}

export const bookmarkAction = {
    svg: BOOKMARK_SVG,
    actionFunction: bookmarkActionFunction,
}

export const fullCoverageAction = {
    svg: FULLCOVERAGE_SVG,
    actionFunction: fullCoverageActionFunction,
}

export const backAction = {
    svg: BACKACTION_SVG,
    actionFunction: goBack,
}

export const dailyRecapAction = {
    svg: DAILYRECAP_SVG,
    actionFunction: undefined,
}