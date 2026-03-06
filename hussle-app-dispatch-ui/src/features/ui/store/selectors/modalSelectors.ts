import { createSelector } from "@reduxjs/toolkit";
import { get } from "lodash";


export const currentModalSelector = (state) => {
    const modalList = state?.ui?.modals;
    if(modalList?.length){
        return modalList[0]
    }
    return null
}

export const requestStatusSelector = (state) => state?.ui?.requestStatus;

export const uiStateSelector = (state) => state?.ui?.uiState;


export const notificationSelector = createSelector(uiStateSelector, (uiState) => {
    return get(uiState, ['notifications'], [])
})