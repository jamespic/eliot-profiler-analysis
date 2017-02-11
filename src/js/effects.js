'use strict'
import {Constants, Actions} from './actions'
import fetch from 'isomorphic-fetch'
import {stringify} from 'query-string'
import Immutable from 'seamless-immutable'
import _ from 'lodash'

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

export async function viewEffect ({action: {payload: {profileId}}, dispatch, getState}) {
  let downloadedProfiles = getState().profiles.results
  if (!(downloadedProfiles && (profileId in downloadedProfiles))) {
    let result = await fetch(`/api/data/${encodeURIComponent(profileId)}`)
    let json = await result.json()
    dispatch(Actions.RECEIVE_PROFILE_DATA(profileId, json))
  }
}

export default [
  {action: Constants.NAVIGATE_SEARCH, effect: searchEffect},
  {action: Constants.WANT_MORE, effect: searchMoreEffect},
  {action: Constants.NAVIGATE_VIEW_PROFILE, effect: viewEffect}
]
