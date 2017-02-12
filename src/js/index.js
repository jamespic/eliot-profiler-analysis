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
import {Main, Router} from './views'
import Effects from './effects'
import moment from 'moment'
import './styles.scss'
import 'font-awesome/scss/font-awesome.scss'

const composeEnhancers = ((typeof window !== 'undefined') && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose

const store = createStore(
  combineReducers(reducers),
  composeEnhancers(applyMiddleware(effectsMiddleware(Effects)))
)

const render = createApp(document.getElementById('main'), store.dispatch)

store.subscribe(() => render(<Main />, store.getState()))

page('/view/:profileId', (context) => {
  let qs = parse(context.querystring)
  let flatten = qs.flatten || 'none'
  let bottomUp = qs.bottomUp === 'true'
  store.dispatch(Actions.NAVIGATE_VIEW_PROFILE(context.params.profileId, bottomUp, flatten))
})
page('/search', (context) => {
  store.dispatch(Actions.NAVIGATE_SEARCH(parse(context.querystring)))
})
page('/', '/search')
page({decodeURLComponents: false})

moment.locale(window.navigator.language)
