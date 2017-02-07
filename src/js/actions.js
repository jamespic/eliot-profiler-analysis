import {createActions} from 'redux-actions'

export const {navigateViewProfile, navigateSearch} = createActions(
  {},
  'NAVIGATE_VIEW_PROFILE',
  'NAVIGATE_SEARCH'
)
