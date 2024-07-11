import router from '../router'
import { config } from '../constants';
import { goBack, showPopup } from './utility';
import { PopupAttributes, List } from '../main';

const FRONTEND_URL = config.url.FRONTEND_URL
const BACKEND_URL = config.url.BACKEND_URL

// SVGs
const SHARE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M22 7H14C12.182 7 11.087 7.892 10.68 8.3C10.555 8.427 10.492 8.49 10.49 8.49C10.49 8.492 10.427 8.555 10.3 8.68C9.892 9.087 9 10.182 9 12V15M22 7L17 2M22 7L17 12" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.465 20.535C4.93 22 7.287 22 12.003 22C16.718 22 19.076 22 20.54 20.535C21.782 19.294 21.971 17.412 22 13.998M3.465 20.535C2 19.07 2 16.713 2 11.997M3.465 20.535C4.929 22 7.286 22 12 22C16.714 22 19.071 22 20.535 20.535C21.776 19.295 21.965 17.413 21.995 13.999M3.465 20.535C2 19.071 2 16.714 2 12M3.465 3.46C4.706 2.218 6.588 2.029 10.002 2M2.055 8C2.165 5.807 2.491 4.438 3.465 3.464C4.705 2.224 6.587 2.034 10 2.005" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const BOOKMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 11.098V16.091C3 19.187 3 20.736 3.734 21.412C4.084 21.735 4.526 21.938 4.997 21.992C5.984 22.105 7.137 21.085 9.442 19.046C10.462 18.145 10.971 17.694 11.56 17.576C11.85 17.516 12.15 17.516 12.44 17.576C13.03 17.694 13.539 18.145 14.558 19.046C16.863 21.085 18.016 22.105 19.003 21.991C19.473 21.938 19.916 21.735 20.266 21.412C21 20.736 21 19.188 21 16.091V11.097C21 6.809 21 4.665 19.682 3.332C18.364 2 16.242 2 12 2C7.757 2 5.636 2 4.318 3.332C3.511 4.148 3.198 5.27 3.077 7M15 6H9" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const FULLCOVERAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M3 14V10C3 6.229 3 4.343 4.172 3.172C5.343 2 7.229 2 11 2H13C16.771 2 18.657 2 19.828 3.172C20.482 3.825 20.771 4.7 20.898 6M21 10V14C21 17.771 21 19.657 19.828 20.828C18.657 22 16.771 22 13 22H11C7.229 22 5.343 22 4.172 20.828C3.518 20.175 3.229 19.3 3.102 18M8 14H13M8 10H9M16 10H12" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const BACKACTION_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M22.125 12C22.125 12.2984 22.0065 12.5845 21.7955 12.7955C21.5845 13.0065 21.2984 13.125 21 13.125H5.71499L9.79499 17.205C9.90552 17.308 9.99417 17.4322 10.0557 17.5702C10.1171 17.7082 10.1502 17.8572 10.1529 18.0082C10.1555 18.1593 10.1278 18.3093 10.0712 18.4494C10.0146 18.5895 9.93037 18.7167 9.82354 18.8236C9.71672 18.9304 9.58947 19.0146 9.44938 19.0712C9.3093 19.1278 9.15926 19.1556 9.0082 19.1529C8.85715 19.1502 8.70818 19.1172 8.57018 19.0557C8.43218 18.9942 8.30798 18.9055 8.20499 18.795L2.20499 12.795C1.99431 12.5841 1.87598 12.2981 1.87598 12C1.87598 11.7019 1.99431 11.416 2.20499 11.205L8.20499 5.20501C8.41825 5.00629 8.70032 4.89811 8.99177 4.90325C9.28322 4.90839 9.5613 5.02646 9.76742 5.23258C9.97354 5.4387 10.0916 5.71678 10.0967 6.00823C10.1019 6.29968 9.99371 6.58175 9.79499 6.79501L5.71499 10.875H21C21.2984 10.875 21.5845 10.9935 21.7955 11.2045C22.0065 11.4155 22.125 11.7016 22.125 12Z" fill="white"/></svg>`;
const DAILYRECAP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="22" viewBox="0 0 20 22" fill="none"><path d="M9.99994 13H10.0089M4.99994 21H14.9999M1.51794 9.306C1.12994 8.232 0.93594 7.695 1.01794 7.351C1.10894 6.974 1.37694 6.681 1.71894 6.583C2.03194 6.493 2.51894 6.71 3.49194 7.143C4.35194 7.525 4.78194 7.716 5.18694 7.706C5.63294 7.694 6.06094 7.516 6.40194 7.199C6.71194 6.912 6.91894 6.455 7.33394 5.541L8.24894 3.525C9.01294 1.842 9.39494 1 9.99994 1C10.6049 1 10.9869 1.842 11.7509 3.525L12.6659 5.541C13.0809 6.455 13.2889 6.912 13.5979 7.199C13.9389 7.515 14.3679 7.694 14.8129 7.706C15.2169 7.716 15.6479 7.525 16.5079 7.142C17.4819 6.71 17.9679 6.493 18.2809 6.583C18.6229 6.681 18.8909 6.974 18.9809 7.351C19.0639 7.695 18.8699 8.231 18.4809 9.306L16.8139 13.922C16.0999 15.897 15.7439 16.884 14.9969 17.442C14.2499 18 13.2849 18 11.3559 18H8.64394C6.71394 18 5.74994 18 5.00394 17.442C4.25694 16.884 3.89994 15.897 3.18594 13.922L1.51794 9.306Z" stroke="url(#paint0_linear_269_552)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><defs><linearGradient id="paint0_linear_269_552" x1="18.9999" y1="21" x2="0.999878" y2="1" gradientUnits="userSpaceOnUse"><stop stop-color="#FA0CFF"/><stop offset="1" stop-color="#00FFF0"/></linearGradient></defs></svg>`;
const OPENARTICLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 21 20" fill="none"><path d="M11.1352 14.6695C11.1787 14.7131 11.2133 14.7648 11.2369 14.8217C11.2605 14.8786 11.2726 14.9396 11.2726 15.0012C11.2726 15.0628 11.2605 15.1238 11.2369 15.1807C11.2133 15.2376 11.1787 15.2893 11.1352 15.3328L10.3578 16.1094C9.56652 16.9007 8.49329 17.3452 7.37422 17.3452C6.25516 17.3452 5.18193 16.9007 4.39063 16.1094C3.59933 15.3181 3.15479 14.2448 3.15479 13.1258C3.15479 12.0067 3.59933 10.9335 4.39063 10.1422L6.27422 8.25781C7.03504 7.49612 8.05827 7.05412 9.13437 7.02231C10.2105 6.99051 11.258 7.3713 12.0625 8.08671C12.1087 8.12775 12.1463 8.17748 12.1733 8.23306C12.2002 8.28864 12.2159 8.34899 12.2196 8.41065C12.2232 8.47232 12.2146 8.53409 12.1944 8.59245C12.1741 8.65081 12.1426 8.70461 12.1016 8.75078C12.0605 8.79694 12.0108 8.83458 11.9552 8.86153C11.8996 8.88847 11.8393 8.90421 11.7776 8.90784C11.716 8.91147 11.6542 8.90291 11.5958 8.88266C11.5375 8.86242 11.4837 8.83088 11.4375 8.78984C10.8118 8.23406 9.99747 7.93834 9.16098 7.96317C8.32449 7.988 7.52909 8.33151 6.93751 8.92343L5.05313 10.8047C4.43754 11.4203 4.0917 12.2552 4.0917 13.1258C4.0917 13.9964 4.43754 14.8313 5.05313 15.4469C5.66872 16.0625 6.50364 16.4083 7.37422 16.4083C8.2448 16.4083 9.07972 16.0625 9.69532 15.4469L10.4719 14.6695C10.5154 14.6259 10.5671 14.5914 10.624 14.5678C10.6809 14.5442 10.7419 14.532 10.8035 14.532C10.8651 14.532 10.9261 14.5442 10.983 14.5678C11.0399 14.5914 11.0916 14.6259 11.1352 14.6695ZM16.6094 3.88827C15.8176 3.09795 14.7445 2.65408 13.6258 2.65408C12.507 2.65408 11.434 3.09795 10.6422 3.88827L9.86485 4.66484C9.8213 4.70839 9.78675 4.76009 9.76318 4.817C9.73961 4.8739 9.72748 4.93489 9.72748 4.99648C9.72748 5.05807 9.73961 5.11906 9.76318 5.17596C9.78675 5.23286 9.8213 5.28457 9.86485 5.32812C9.95281 5.41607 10.0721 5.46549 10.1965 5.46549C10.2581 5.46549 10.3191 5.45336 10.376 5.42979C10.4329 5.40622 10.4846 5.37167 10.5281 5.32812L11.3047 4.54687C11.9203 3.93128 12.7552 3.58544 13.6258 3.58544C14.4964 3.58544 15.3313 3.93128 15.9469 4.54687C16.5625 5.16246 16.9083 5.99738 16.9083 6.86796C16.9083 7.73854 16.5625 8.57346 15.9469 9.18906L14.0625 11.0789C13.4709 11.6708 12.6755 12.0143 11.839 12.0392C11.0025 12.064 10.1882 11.7683 9.5625 11.2125C9.51634 11.1715 9.46254 11.1399 9.40418 11.1197C9.34582 11.0994 9.28405 11.0909 9.22238 11.0945C9.16072 11.0981 9.10037 11.1139 9.04479 11.1408C8.98921 11.1678 8.93948 11.2054 8.89844 11.2516C8.8574 11.2977 8.82586 11.3515 8.80561 11.4099C8.78537 11.4682 8.77681 11.53 8.78044 11.5917C8.78407 11.6533 8.79981 11.7137 8.82676 11.7693C8.8537 11.8249 8.89134 11.8746 8.9375 11.9156C9.7419 12.6306 10.7891 13.0111 11.8648 12.9793C12.9406 12.9475 13.9635 12.5058 14.7242 11.7445L16.6078 9.86015C17.0002 9.46844 17.3115 9.00325 17.5239 8.49115C17.7363 7.97906 17.8458 7.43012 17.8459 6.87571C17.846 6.3213 17.7369 5.7723 17.5247 5.26009C17.3126 4.74789 17.0015 4.28253 16.6094 3.89062V3.88827Z" fill="white"/></svg>`

// Functions
export async function actionShareFunction(article) {
    try {
        let shareData = {
            title: `Check out this summarized article on Sumnews`,
            text: `${article.title}`,
            url: `${FRONTEND_URL}article/${article.uuid}`,
        };

        // Try to fetch the image
        if (article.imageUrl) {
            try {
                const response = await fetch(article.imageUrl);
                if (response.ok) {
                    const blob = await response.blob();
                    const file = new File([blob], "article_image.jpg", { type: 'image/jpeg' });
                    shareData.files = [file];
                }
            } catch (error) {
                console.error('Error fetching image:', error.message);
                // If there's an error fetching the image, we'll proceed without it
            }
        }

        if (navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.error('Error sharing:', error.message);
                showPopup(2, "Oops, something went wrong...");
            }
        } else {
            // Fallback if Web Share API is not supported
            if (window.isSecureContext) {
                navigator.clipboard.writeText(`${article.title} - ${FRONTEND_URL}article/${article.uuid}`);
                showPopup(1, "Link copied to clipboard successfully");
            } else {
                showPopup(2, "Oops, something went wrong...");
            }
        }
    } catch (error) {
        console.error('Error in actionShareFunction:', error.message);
        showPopup(2, "Oops, something went wrong...");
    }
}

function bookmarkActionFunction() {
    showPopup(1, "Your article has been bookmarked succesfully")
}

function fullCoverageActionFunction(article) {
    List.articles = [];
    router.push(`/event/${article.eventUri}`)
}

function openArticleActionFunction(article) {
    window.open(article.url, '_blank')
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

export const openArticleAction = {
    svg: OPENARTICLE_SVG,
    actionFunction: openArticleActionFunction
}