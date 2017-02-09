'use strict'
import {Constants, Actions} from './actions'
import fetch from 'isomorphic-fetch'
import {stringify} from 'query-string'
import Immutable from 'seamless-immutable'
import _ from 'lodash'


export async function searchEffect ({action: {payload: params}, dispatch, getState}) {
  let {profiles: {search}} = getState()
  if (!_.isEqual(params, search)) {
    params = Immutable(params).set('_count', 100)
    let result = await fetch(`/api/data?${stringify(params)}`)
    let json = await result.json()
    dispatch(Actions.RECEIVE_SEARCH_RESULTS(params, json))
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
  {action: Constants.NAVIGATE_VIEW_PROFILE, effect: viewEffect},
]
