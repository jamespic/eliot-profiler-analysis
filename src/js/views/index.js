'use strict'
import {element} from './deku-seamless-immutable'
import {Actions, Constants} from '../actions'
import {stripMessageBarriers, flattenByLine, flattenByMethod, flattenByFile, selfGraph} from './callgraph-helpers'
import _ from 'lodash'
import CallGraph from './callgraph'
import BottomUpCallGraph from './bottomup-callgraph'
import DropDown from './dropdown'
import Search from './search'

export function Main () {
  return <div class='container-fluid'>
    <RoutedContent />
  </div>
}

export function RoutedContent ({context: {lastNavigation, profiles}}) {
  switch (lastNavigation.type) {
    case Constants.NAVIGATE_SEARCH:
      return <ViewSearch params={lastNavigation.payload} profiles={profiles} />
    case Constants.NAVIGATE_VIEW_PROFILE: {
      let {profileId, bottomUp, flatten} = lastNavigation.payload
      return <ViewProfile profileId={profileId} data={profiles.results[profileId]} bottomUp={bottomUp} flatten={flatten} />
    }
    default:
      return <h1>Loading...</h1>
  }
}

export function ViewSearch ({props: {params, profiles}, dispatch}) {
  if (_.isEqual(params, profiles.search)) {
    return <div>
      <Search profiles={profiles} />
      <button onClick={() => dispatch(Actions.WANT_MORE())}>More</button>
    </div>
  } else return <h1>Searching...</h1>
}

export function ViewProfile ({props: {profileId, data, bottomUp, flatten}}) {
  function changedOptionUrl (option, value) {
    let newBottomUp = (option === 'bottomUp') ? value : bottomUp
    let newFlatten = (option === 'flatten') ? value : flatten
    return `/view/${encodeURIComponent(profileId)}?bottomUp=${newBottomUp}&flatten=${newFlatten}`
  }
  if (!data) return <h1>Loading...</h1>
  switch (flatten) {
    case 'strip_messages':
      data = stripMessageBarriers(data)
      break
    case 'line':
      data = stripMessageBarriers(data, flattenByLine)
      break
    case 'method':
      data = stripMessageBarriers(data, flattenByMethod)
      break
    case 'file':
      data = stripMessageBarriers(data, flattenByFile)
      break
    default:
      // pass
  }
  return <div class='card'>
    <div class='card-header'>
      <nav class='nav nav-pills flex-column flex-sm-row'>
        <DropDown title={bottomUp ? 'Bottom Up' : 'Top Down'}>
          <a class={`dropdown-item ${bottomUp ? '' : 'active'}`}
            href={changedOptionUrl('bottomUp', false)}>Top Down</a>
          <a class={`dropdown-item ${bottomUp ? 'active' : ''}`}
            href={changedOptionUrl('bottomUp', true)}>Bottom Up</a>
        </DropDown>
        <DropDown title='Filter'>
          <a class={`dropdown-item ${flatten === 'none' ? 'active' : ''}`}
            href={changedOptionUrl('flatten', 'none')}>No Filter</a>
          <a class={`dropdown-item ${flatten === 'strip_messages' ? 'active' : ''}`}
            href={changedOptionUrl('flatten', 'strip_messages')}>Hide Messages</a>
          <a class={`dropdown-item ${flatten === 'line' ? 'active' : ''}`}
            href={changedOptionUrl('flatten', 'line')}>Collapse Recursive Lines</a>
          <a class={`dropdown-item ${flatten === 'method' ? 'active' : ''}`}
            href={changedOptionUrl('flatten', 'method')}>Collapse Recursive Methods</a>
          <a class={`dropdown-item ${flatten === 'file' ? 'active' : ''}`}
            href={changedOptionUrl('flatten', 'file')}>Collapse Recursive Files</a>
        </DropDown>
      </nav>
    </div>
    <div class='card-block'>
      {
        bottomUp
        ? <BottomUpCallGraph key='bottomUpGraph' callGraph={selfGraph(data)} totalTime={data.time} />
        : <CallGraph key='topDownGraph' callGraph={data} totalTime={data.time} />
      }
    </div>
  </div>
}
