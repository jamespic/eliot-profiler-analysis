'use strict'
import Immutable from 'seamless-immutable'

export const Actions = {
  RECEIVE_SEARCH_RESULTS(params, results) {
    return {params, results}
  },
  RECEIVE_PROFILE_DATA(profileId, data) {
    return {profileId, data}
  },
  NAVIGATE_VIEW_PROFILE(profileId, bottomUp=false, flatten) {
    return {profileId, bottomUp, flatten}
  },
  NAVIGATE_SEARCH(params) {
    return params
  },
  TOGGLE_CALL_GRAPH_NODE(path) {
    return path
  }
}

export const Constants = {}

for (let action in Actions) {
  let currentAction = Actions[action]
  Actions[action] = function() {
    return Immutable({type: action, payload: currentAction.apply(this, arguments)})
  }
  Constants[action] = action
}
