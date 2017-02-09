'use strict'
import EasyActions from 'redux-easy-actions'
import Immutable from 'seamless-immutable'

export const {Actions, Constants} = EasyActions({
  RECEIVE_SEARCH_RESULTS(type, params, results) {
    return Immutable({type, payload: {params, results}})
  },
  RECEIVE_PROFILE_DATA(type, profileId, data) {
    return Immutable({type, payload: {profileId, data}})
  },
  NAVIGATE_VIEW_PROFILE(type, profileId) {
    return Immutable({type, payload: profileId})
  },
  NAVIGATE_SEARCH(type, params) {
    return Immutable({type, payload: params})
  }
})
