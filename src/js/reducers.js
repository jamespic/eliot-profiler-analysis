'use strict'
import Immutable from 'seamless-immutable'
import {Constants} from './actions'
import _ from 'lodash'

export function lastNavigation (state = Immutable({}), action) {
  switch (action.type) {
    case Constants.NAVIGATE_SEARCH:
    case Constants.NAVIGATE_VIEW_PROFILE:
      return action
    default:
      return state
  }
}

export function profiles (state = Immutable({search: null, results: {}}), action) {
  switch (action.type) {
    case Constants.RECEIVE_PROFILE_DATA:{
      let {payload: {profileId, data}} = action
      return Immutable({
        search: null,
        results: {[profileId]: data}
      })
    }
    case Constants.RECEIVE_SEARCH_RESULTS: {
      let {payload: {params, results}} = action
      return Immutable({
        search: params,
        results: _.fromPairs(results)
      })
    }
    case Constants.GOT_MORE: {
      let {payload: {params, results}} = action
      if (_.isEqual(params, state.search)) {
        return state.set('results', state.results.merge(_.fromPairs(results)))
      } else return state
    }
    default:
      return state
  }
}

export function expandedCallGraphNodes (state = Immutable({}), action) {
  switch (action.type) {
    case Constants.TOGGLE_CALL_GRAPH_NODE:
      return state.update(action.payload, x => !x)
    case Constants.NAVIGATE_SEARCH:
    case Constants.NAVIGATE_VIEW_PROFILE:
      return Immutable({})
    default:
      return state
  }
}
