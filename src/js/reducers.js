'use strict'
import Immutable from 'seamless-immutable'
import {Constants} from './actions'
import _ from 'lodash'

export function lastNavigation (state=Immutable({}), action) {
  switch (action.type) {
    case Constants.NAVIGATE_SEARCH:
    case Constants.NAVIGATE_VIEW_PROFILE:
      return action
    default:
      return state
  }
}

export function profiles (state=Immutable({}), action) {
  switch (action.type) {
    case Constants.RECEIVE_PROFILE_DATA:
      let {payload: {profileId, data}} = action
      return Immutable({
        search: null,
        results: {[profileId]: data}
      })
    case Constants.RECEIVE_SEARCH_RESULTS:
      let {payload: {params, results}} = action
      return Immutable({
        search: params,
        results: _.fromPairs(action.payload.results)
      })
    default:
      return state
  }
}
