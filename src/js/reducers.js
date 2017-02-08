import Immutable from 'seamless-immutable'
import {navigateSearch, navigateViewProfile} from './actions'
import {handleAction, combineActions} from 'redux-actions'

export const lastNavigation = handleAction(
  combineActions(navigateSearch, navigateViewProfile),
  (state, payload) => Immutable(payload),
  Immutable({})
)
