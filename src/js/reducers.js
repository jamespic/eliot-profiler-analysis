import Immutable from 'seamless-immutable'
import {navigateSearch, navigateViewProfile} from './actions'
import {handleAction, combineActions} from 'redux-actions'

// export function lastNavigation(state = Immutable({}), action) {
//   switch (action.type) {
//     case NavigateSearch:
//     case NavigateViewProfile:
//       return Immutable(action)
//     default:
//       return state
//   }
// }

export const lastNavigation = handleAction(
  combineActions(navigateSearch, navigateViewProfile),
  (state, payload) => Immutable(payload),
  Immutable({})
)
