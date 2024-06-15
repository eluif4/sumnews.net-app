import { bookmarkAction, dailyRecapAction, fullCoverageAction, shareAction } from "./actions";

// export const EXAMPLE_SWIPE_ACTION = {
//     color: '#FFFFFF', // Color of swipe background
//     action: exampleAction, // Action when swipe happens
//     svg: `example.svg`, // SVG to be placed on background
//     direction: 'right' // Direction of swip
// }

export const SHARE_SWIPE_ACTION = {
    color: '#FF1212',
    action: shareAction,
    svg: shareAction.svg,
    direction: 'left',
    activateCondition: (article) => true,
}

export const FULL_COVERAGE_SWIPE_ACTION = {
    color: '#449651',
    action: fullCoverageAction,
    svg: fullCoverageAction.svg,
    direction: 'right',
    activateCondition: (article) => !!article?.eventUri,
}

export const BOOKMARK_SWIPE_ACTION = {
    color: '#FFA012',
    action: bookmarkAction,
    svg: bookmarkAction.svg,
    direction: 'right',
    activateCondition: (article) => true,
}

export const DAILY_RECAP_SWIPE_ACTION = {
    color: '#0075FF',
    action: dailyRecapAction,
    svg: dailyRecapAction.svg,
    direction: 'right',
    activateCondition: (article) => !!article?.drUri,
}