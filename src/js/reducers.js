'use strict'
import Immutable from 'seamless-immutable'
import {Constants} from './actions'
import _ from 'lodash'
import moment from 'moment'

export function lastNavigation (state = Immutable({}), action) {
  switch (action.type) {
    case Constants.NAVIGATE_SEARCH:
    case Constants.NAVIGATE_VIEW_PROFILE:
    case Constants.NAVIGATE_VIEW_AGGREGATE:
      return action
    default:
      return state
  }
}

export function profileData (state = Immutable({}), action) {
  switch (action.type) {
    case Constants.RECEIVE_PROFILE_DATA:
      return action.payload
    default:
      return state
  }
}

export function profileAggregateData (state = Immutable({}), action) {
  switch (action.type) {
    case Constants.RECEIVE_PROFILE_AGGREGATE_DATA:
      return action.payload
    default:
      return state
  }
}

export function searchResults (state = Immutable({search: null, results: {}}), action) {
  switch (action.type) {
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
    case Constants.NAVIGATE_VIEW_AGGREGATE:
      return Immutable({})
    default:
      return state
  }
}

function _formatDatetimeLocal (m) {
  m = moment(m)
  if (m.isValid()) return m.format('YYYY-MM-DDTHH:mm:ss')
  else return ''
}

export function searchOptions (state = Immutable({}), action) {
  switch (action.type) {
    case Constants.NAVIGATE_SEARCH: {
      let options = action.payload
      if (options._start_time) {
        options = options.update('_start_time', _formatDatetimeLocal)
      }
      if (options._end_time) {
        options = options.update('_end_time', _formatDatetimeLocal)
      }
      return options
    }

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
