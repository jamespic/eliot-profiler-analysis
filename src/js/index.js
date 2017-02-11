'use strict'
import {createApp, element} from 'deku'
import {applyMiddleware, createStore, compose} from 'redux'
import page from 'page'
import Immutable from 'seamless-immutable'
import {effectsMiddleware} from 'redux-effex'
import {combineReducers} from 'redux-seamless-immutable'
import {parse} from 'query-string'
import {Actions} from './actions'
import * as reducers from './reducers'
import {Router} from './views'
import Effects from './effects'
import 'bootstrap/scss/bootstrap.scss'
import 'font-awesome/scss/font-awesome.scss'

const composeEnhancers = ((typeof window !== 'undefined') && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose

const store = createStore(
  combineReducers(reducers),
  composeEnhancers(applyMiddleware(effectsMiddleware(Effects)))
)

const render = createApp(document.getElementById('main'), store.dispatch)

store.subscribe(() => render(<Router />, store.getState()))

page('/view/:profileId', (context, next) => {
  store.dispatch(Actions.NAVIGATE_VIEW_PROFILE(context.params.profileId, false, context.hash))
  next()
})
page('/view/:profileId/bottomUp', (context, next) => {
  store.dispatch(Actions.NAVIGATE_VIEW_PROFILE(context.params.profileId, true, context.hash))
  next()
})
page('/search', (context, next) => {
  store.dispatch(Actions.NAVIGATE_SEARCH(parse(context.querystring)))
  next()
})
page('/', '/search')
page({decodeURLComponents: false})
