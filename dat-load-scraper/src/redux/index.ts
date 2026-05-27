import { createSlice, configureStore, combineReducers } from '@reduxjs/toolkit'
import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects'
import createSagaMiddleware from 'redux-saga'
import logger, { createLogger } from 'redux-logger'
import {createLoadMap,  findDuplicatesId, calculateLoadsMiniumAcceptableOffer, calculateMiniumAcceptableOffer} from "../utils/removeDuplicates";
import {currencyFormatter } from "../utils/formatters"

export const saveDatLoadsToStore = (loadData) => {
  return({
    type: "STORE_DAT_LOADS",
    payload: {
      data: loadData
    }
  })
}

export const saveRelayLoadsToStore = (relayData) => {
  return({
    type: "STORE_RELAY_LOADS",
    payload: relayData
  })
}

const removeElement = (dupIds) => {
  for(let id of dupIds){
      const query = `.search-card.${id}`
      const dupElement = document.querySelector<HTMLElement>(query)
      if(dupElement){
          dupElement.style.display = "none"
      }
  }
}


// const updateMiniumRateDom = (innerText, id) => {
//   console.log("loadId", id)
//   const rateDomElement = document.querySelector(`#${id}`);
//   console.log("This is the rateDom Element", rateDomElement)
// }


const createMiniumRateEle = (innerText, id) => {
  var el = document.createElement('span');
  el.setAttribute('class', 'mocho-min-rate');
  el.setAttribute('id', `min-rate-${id}`)
  el.innerText = innerText
  return el
}


function* fetchUser(action) {
  try {
    const datLoads = action.payload.data;
    const dupIds = findDuplicatesId(datLoads)
    yield put({type: "SAVE_FILTER_IDS", payload: { dupIds }})

    const searchCardNodeList = document.querySelectorAll(".search-card.expanded-view");
    yield call(removeElement, dupIds)

    const loads = yield select(state => state?.loads.data)
    const loadFilter = yield select(state => state?.loadFilters);
    const { dispatchFee, ratePerMile } = loadFilter
    console.log("dispatchFee", dispatchFee)
    console.log("ratePerMile", ratePerMile)
    const loadsWithMiniumRate = calculateLoadsMiniumAcceptableOffer(loads, ratePerMile, dispatchFee);
    console.log("loadsWithMinRate", loadsWithMiniumRate)
    for (let ele of searchCardNodeList){
      const classList = ele?.classList;
      const loadId = classList[0]
      const load = loadsWithMiniumRate.filter((obj) => obj.matchId === loadId)[0]
      const { miniumRate } = load;
      const rateDiv = ele.querySelector(".lower-cell.rate-cell");
      const formattedRate = currencyFormatter(miniumRate)
      const miniumRateEle = createMiniumRateEle(formattedRate, loadId)
      // updateMiniumRateDom(formattedRate, loadId)
      rateDiv.append(miniumRateEle)
    }
  } catch (e) {
    console.log("Error in saga", e)
  }
}


function* handleFiltering(action){
  try{

    const { loadId } = action.payload;
    const loads = yield select((state) => state?.loads.data)
    const { ratePerMile, dispatchFee } = yield select((state) => state?.loadFilters)
    const childItem = document.querySelector(`.cdk-virtual-scroll-content-wrapper .${loadId}`)
    
    // const state = store.getState()
    // const filteredLoadsId = state?.loads?.filteredLoadsId;
    // if(filteredLoadsId.includes(loadId)){
    //     const query = `.search-card.${loadId}`
    //     const dupElement = document.querySelector<HTMLElement>(query)
    //     if(dupElement){
    //         dupElement.style.display = "none"
    //     }
    // }

    const load = loads.filter((obj) => obj.matchId === loadId)[0]

    // const { miniumRate } = load;
    const miniumRate = calculateMiniumAcceptableOffer(load, ratePerMile, dispatchFee)
    const rateDiv = childItem.querySelector(".lower-cell.rate-cell");
    const formattedRate = currencyFormatter(miniumRate)
    const miniumRateEle = createMiniumRateEle(formattedRate, loadId);
    // updateMiniumRateDom(formattedRate, loadId)
    rateDiv.append(miniumRateEle)
  
  }catch(e){
    console.error("Error in handling filtering....")
  }
}


function* handleFilteringChange(action){
  try{
    console.log("handleFilteringChange action", action)
    const { dispatchFee, factorable, ratePerMile } = action.payload;

    yield put({type: "APPLY_LOAD_FILTER", payload: { dispatchFee, factorable, ratePerMile }})

    // const state = store.getState()
        
    const loads = yield select((state) => state?.loads.data)
    const searchCardNodeList = document.querySelectorAll(".search-card.expanded-view");
    // const filteredLoadsId = state?.loads?.filteredLoadsId;
    const loadsWithMiniumRate = calculateLoadsMiniumAcceptableOffer(loads, ratePerMile, dispatchFee);
    for (let ele of searchCardNodeList){
      const classList = ele?.classList;
      const loadId = classList[0]
      const load = loadsWithMiniumRate.filter((obj) => obj.matchId === loadId)[0]
      const { miniumRate } = load;
      const rateDiv = ele.querySelector(".lower-cell.rate-cell");
      const formattedRate = currencyFormatter(miniumRate)
      const rateDomElement: any = document.querySelector(`#min-rate-${loadId}`);

      console.log("Dom that needs updating", rateDomElement)
      if(rateDomElement){
        rateDomElement.innerText = formattedRate
      }else{
        const miniumRateEle = createMiniumRateEle(formattedRate, loadId)
        rateDiv.append(miniumRateEle)
      }

    }

  }catch(e){
    console.error("Error in handling filtering....")
  }
}

function* mySaga() {
  yield takeEvery("STORE_DAT_LOADS", fetchUser);
  yield takeEvery("TEST", handleFiltering)
  yield takeEvery("UPDATED_LOAD_FILTERS", handleFilteringChange)
  yield takeEvery("STORE_RELAY_LOADS", handleRelayLoads)
}


const initialState = {
  data: [],
  filteredLoadsId: []
}


const loadsReducer = (state = initialState, action) => {
  switch(action.type){
    case "STORE_DAT_LOADS": {
      console.log('reducer is handling this request', action)
      const {data} = action.payload;
      return {
        ...state,
        data
      }
    }

    case "SAVE_FILTER_IDS": {
      console.log('reducer is handling this request', action)
      const {dupIds} = action.payload;
      return {
        ...state,
        filteredLoadsId: dupIds
      }
    }
    default:
      return state
  }
}


const loadsFilterReducer = (state = {
  dispatchFee: 0.5,
  ratePerMile: 2
}, action) => {
  switch(action.type){
    case "APPLY_LOAD_FILTER":{
      const {dispatchFee, factorable, ratePerMile } =  action.payload;
      return({
        ...state,
        dispatchFee,
        ratePerMile
      })
    }
    
    default:
      return state
  }
}


const relayLoadsReducer = (state = { data: [], currentSnapshot: null }, action) => {
  switch(action.type){
    case "STORE_RELAY_LOADS": {
      const { path, method, data } = action.payload;
      console.log(`[Hustle] Relay store update — ${method} ${path}`, data);
      return {
        ...state,
        currentSnapshot: { path, method, data, timestamp: Date.now() }
      }
    }
    default:
      return state
  }
}

function* handleRelayLoads(action) {
  try {
    const { path, method, data } = action.payload;
    console.log(`[Hustle] Relay saga — ${method} ${path}`, data);
    // TODO: process relay loads once we identify the response shape
  } catch (e) {
    console.error("[Hustle] Error in relay saga", e)
  }
}

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
  middleware: [sagaMiddleware,
    // logger
  ],
    reducer: combineReducers({
      loads: loadsReducer,
      loadFilters: loadsFilterReducer,
      relayLoads: relayLoadsReducer
    })
});

sagaMiddleware.run(mySaga)

