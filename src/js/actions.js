'use strict'
import Immutable from 'seamless-immutable'

export const Actions = {
  RECEIVE_SEARCH_RESULTS (params, results) {
    return {params, results}
  },
  RECEIVE_PROFILE_DATA (profileId, data) {
    return {profileId, data}
  },
  RECEIVE_ATTRIB_LIST (attribList) {
    return attribList
  },
  RECEIVE_ATTRIB_VALUES (attrib, values) {
    return {attrib, values}
  },
  NAVIGATE_VIEW_PROFILE (profileId, bottomUp = false, flatten) {
    return {profileId, bottomUp, flatten}
  },
  NAVIGATE_SEARCH (params) {
    return params
  },
  CHANGE_SEARCH_OPTIONS (options) {
    return options
  },
  TOGGLE_CALL_GRAPH_NODE (path) {
    return path
  },
  SET_VISIBLE_DROPDOWN (path = null) {
    return path
  },
  WANT_MORE () {
    return null
  },
  GOT_MORE (params, results) {
    return {params, results}
  }
}

export const Constants = {}

for (let action in Actions) {
  let currentAction = Actions[action]
  Actions[action] = function () {
    return Immutable({type: action, payload: currentAction.apply(this, arguments)})
  }
  Constants[action] = action
}
