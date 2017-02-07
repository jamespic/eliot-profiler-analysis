import {createApp, element} from 'deku'
import {applyMiddleware, createStore} from 'redux'
import page from 'page'
import Immutable from 'seamless-immutable'
import {effectsMiddleware} from 'redux-effex'
import {combineReducers} from 'redux-seamless-immutable'
import * as reducers from './reducers'
import Effects from './effects'
import {navigateSearch, navigateViewProfile} from './actions'
import {ViewProfile, ViewSearch} from './views'

const store = createStore(
  combineReducers(reducers),
  applyMiddleware(effectsMiddleware(Effects))
)

const render = createApp(document.getElementById('main'), store.dispatch)

function Router({context: {lastNavigation}}) {
  switch (lastNavigation.type) {
    case 'NAVIGATE_VIEW_PROFILE':
      return <ViewProfile profileId={lastNavigation.payload} />
    case 'NAVIGATE_SEARCH':
      return <ViewSearch />
    default:
      return <h1>Err.. I'm lost</h1>
  }
}

store.subscribe(() => render(<Router />, store.getState()))
store.dispatch(navigateViewProfile('123'))
