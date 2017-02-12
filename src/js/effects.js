'use strict'
import {Constants, Actions} from './actions'
import fetch from 'isomorphic-fetch'
import {stringify} from 'query-string'
import Immutable from 'seamless-immutable'
import _ from 'lodash'
import page from 'page'

export async function searchEffect ({action: {payload: params}, dispatch, getState}) {
  let {profiles: {search}} = getState()
  if (!_.isEqual(params, search)) {
    let requestParams = Immutable(params).set('_count', 100)
    let result = await fetch(`/api/data?${stringify(requestParams)}`)
    let json = await result.json()
    dispatch(Actions.RECEIVE_SEARCH_RESULTS(params, json))
  }
}

export async function searchMoreEffect ({action, dispatch, getState}) {
  let {profiles: {search, results}} = getState()
  if (search != null) {
    let keys = Object.keys(results)
    let requestParams = Immutable(search).merge({
      _count: keys.length,
      _start_record: keys[keys.length - 1]
    })
    let result = await fetch(`/api/data?${stringify(requestParams)}`)
    let json = await result.json()
    dispatch(Actions.GOT_MORE(search, json))
  }
}

async function _refreshAttribs (searchAttribs, knownAttribs, dispatch) {
  for (let key of searchAttribs) {
    if (!key.startsWith('_') && (knownAttribs[key] || []).length === 0) {
      let result = await fetch(`/api/attribs/${encodeURIComponent(key)}`)
      let json = await result.json()
      dispatch(Actions.RECEIVE_ATTRIB_VALUES(key, json))
    }
  }
}

export async function searchAttribsEffect ({action, dispatch, getState}) {
  let {params} = action.payload
  let result = await fetch('/api/attribs')
  let json = await result.json()
  dispatch(Actions.RECEIVE_ATTRIB_LIST(json))
  await _refreshAttribs(Object.keys(params), {}, dispatch)
}

export async function attribValuesEffect ({action, dispatch, getState}) {
  let params = action.payload
  let {attribs} = getState()
  await _refreshAttribs(Object.keys(params), attribs, dispatch)
}

export async function viewEffect ({action: {payload: {profileId}}, dispatch, getState}) {
  let downloadedProfiles = getState().profiles.results
  if (!(downloadedProfiles && (profileId in downloadedProfiles))) {
    let result = await fetch(`/api/data/${encodeURIComponent(profileId)}`)
    let json = await result.json()
    dispatch(Actions.RECEIVE_PROFILE_DATA(profileId, json))
  }
}

export async function dropDownEffect ({action: {payload: path}, dispatch, nextDispatchAsync}) {
  if (path !== null) {
    var dropDownElement = window.document.getElementById(`dropdown-button.${path}`)
    function dropDownListener (e) {
      if (!dropDownElement.contains(e.target)) {
        dispatch(Actions.SET_VISIBLE_DROPDOWN(null))
      }
    }
    window.document.addEventListener('click', dropDownListener)
    await Promise.resolve() // Next tick - avoid re-seeing same message
    await nextDispatchAsync(Constants.SET_VISIBLE_DROPDOWN)
    window.document.removeEventListener('click', dropDownListener)
  }
}

export default [
  {action: Constants.NAVIGATE_SEARCH, effect: searchEffect},
  {action: Constants.RECEIVE_SEARCH_RESULTS, effect: searchAttribsEffect},
  {action: Constants.CHANGE_SEARCH_OPTIONS, effect: attribValuesEffect},
  {action: Constants.WANT_MORE, effect: searchMoreEffect},
  {action: Constants.NAVIGATE_VIEW_PROFILE, effect: viewEffect},
  {action: Constants.SET_VISIBLE_DROPDOWN, effect: dropDownEffect}
]
