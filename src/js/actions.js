'use strict'
import EasyActions from 'redux-easy-actions'
import Immutable from 'seamless-immutable'

export const {Actions, Constants} = EasyActions({
  RECEIVE_SEARCH_RESULTS (type, params, results) {
    return Immutable({type, payload: {params, results}})
  },
  RECEIVE_PROFILE_DATA (type, profileId, data) {
    return Immutable({type, payload: {profileId, data}})
  },
  NAVIGATE_VIEW_PROFILE (type, profileId, bottomUp=false, flatten) {
    return Immutable({type, payload: {profileId, bottomUp, flatten}})
  },
  NAVIGATE_SEARCH (type, params) {
    return Immutable({type, payload: params})
  },
  TOGGLE_CALL_GRAPH_NODE (type, path) {
    return Immutable({type, payload: path})
  }
})
