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

function Router ({context: {lastNavigation}}) {
  let routes = {
    [navigateSearch]: () => <ViewSearch />,
    [navigateViewProfile]: () => <ViewProfile profileId={lastNavigation.payload} />
  }
  return routes[lastNavigation]()
}

store.subscribe(() => render(<Router />, store.getState()))
store.dispatch(navigateViewProfile('123'))
