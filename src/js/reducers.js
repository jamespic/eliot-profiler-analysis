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

export function searchOptions (state = Immutable({}), action) {
  switch (action.type){
    case Constants.NAVIGATE_SEARCH:
      return action.payload
    case Constants.CHANGE_SEARCH_OPTIONS:
      return action.payload
    default:
      return state
  }
}

export function expandedDropDown (state = null, action) {
  switch (action.type) {
    case Constants.SET_VISIBLE_DROPDOWN:
      return action.payload
    default:
      return state
  }
}

export function attribs (state = Immutable({}), action) {
  switch (action.type) {
    case Constants.RECEIVE_ATTRIB_LIST:
      return Immutable(
        _.fromPairs(
          action.payload.map(x => [x, []])
        )
      )
    case Constants.RECEIVE_ATTRIB_VALUES: {
      let {attrib, values} = action.payload
      if (values.length > 0) return state.set(attrib, values)
      else return state
    }
    default:
      return state
  }
}
