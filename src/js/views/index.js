'use strict'
import {element} from './deku-seamless-immutable'
import {Actions, Constants} from '../actions'
import CallGraph from './callgraph'
import BottomUpCallGraph from './bottomup-callgraph'
import DropDown from './dropdown'
import Search from './search'
import Throbber from './throbber'
import FontAwesome from './font-awesome'
import {stripMessageBarriers, flattenByLine, flattenByMethod, flattenByFile, selfGraph} from './callgraph-helpers'
import _ from 'lodash'
import {stringify} from 'query-string'
import moment from 'moment'

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
      return <Throbber />
  }
}

export function ViewSearch ({props: {params, profiles}, dispatch}) {
  return <div class='row'>
    <div class='col-md-4 col-lg-3'>
      <div class='card'>
        <h3 class='card-header'>Search</h3>
        <div class='card-block'>
          <SearchOptions params={params} />
        </div>
      </div>
    </div>
    <div class='col-md-8 col-lg-9'>
      <div class='card'>
        <h3 class='card-header'>Results</h3>
        {
          _.isEqual(params, profiles.search)
          ? <div>
            <Search profiles={profiles} />
            <div class='card-block'>
              <button class='btn btn-primary btn-lg btn-block'
                onClick={() => dispatch(Actions.WANT_MORE())}>
                More
              </button>
            </div>
          </div>
          : <Throbber />
        }
      </div>
    </div>
  </div>
}

export function SearchOptions ({context: {searchOptions, attribs}, dispatch}) {
  const changeSearchOptions = (option) => (event) => {
    dispatch(Actions.CHANGE_SEARCH_OPTIONS(searchOptions.set(option, event.target.value)))
  }
  const addSearchOption = (event) => {
    dispatch(Actions.CHANGE_SEARCH_OPTIONS(searchOptions.set('', '')))
  }
  const renameSearchOption = (oldName) => (event) => {
    dispatch(Actions.CHANGE_SEARCH_OPTIONS(
      searchOptions.without(oldName).set(event.target.value, '')
    ))
  }
  const removeSearchOption = (option) => (event) => {
    dispatch(Actions.CHANGE_SEARCH_OPTIONS(searchOptions.without(option)))
  }
  let urlParams = searchOptions
    .update('_start_time', x => x ? moment(x).toISOString() : '')
    .update('_end_time', x => x ? moment(x).toISOString() : '')
  return <form>
    <div class='form-group'>
      <label for='_order'>Order</label>
      <select class='form-control' id='_order' onChange={changeSearchOptions('_order')}>
        <option value='newest' selected={searchOptions._order === 'newest'}>Newest First</option>
        <option value='oldest' selected={searchOptions._order === 'oldest'}>Oldest First</option>
      </select>
    </div>
    <div class='form-group'>
      <label for='_start_time'>Start Time</label>
      <input class='form-control'
        type='datetime-local'
        id='_start_time'
        onChange={changeSearchOptions('_start_time')}
        value={searchOptions._start_time}
        step='1' />
    </div>
    <div class='form-group'>
      <label for='_end_time'>End Time</label>
      <input class='form-control'
        type='datetime-local'
        id='_end_time'
        onChange={changeSearchOptions('_end_time')}
        value={searchOptions._end_time}
        step='1' />
    </div>
    {
      _.map(searchOptions, (v, k) => {
        if (k.startsWith('_')) return null
        else {
          return <div class='form-group'>
            <div class='input-group'>
              <select class='form-control' onChange={renameSearchOption(k, v)}>
                {_.map(attribs, (_, attrib) =>
                  <option value={attrib} selected={attrib === k}>{attrib}</option>
                )}
              </select>
              <select class='form-control' onChange={changeSearchOptions(k)}>
                <option value='' />
                {_.map(attribs[k] || [], value =>
                  <option value={value} selected={value === v}>{value}</option>
                )}
              </select>
              <span class='input-group-btn'>
                <button class='btn btn-danger' type='button' onClick={removeSearchOption(k)}>
                  <FontAwesome icon='close' />
                </button>
              </span>
            </div>
          </div>
        }
      })
    }
    <div class='form-group'>
      <button class='btn btn-success' onClick={addSearchOption}>
        Add Term <FontAwesome icon='plus' />
      </button>
      <a class='btn btn-primary float-right' href={`/search?${stringify(urlParams)}`}>
        Search <FontAwesome icon='search' />
      </a>
    </div>
  </form>
}

export function ViewProfile ({props: {profileId, data, bottomUp, flatten}}) {
  if (!data) return <Throbber />
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
      <ViewProfileNav profileId={profileId} bottomUp={bottomUp} flatten={flatten} task_uuid={data.task_uuid}/>
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

function ViewProfileNav ({props: {profileId, bottomUp, flatten, task_uuid}}) {
  function changedOptionUrl (option, value) {
    let newBottomUp = (option === 'bottomUp') ? value : bottomUp
    let newFlatten = (option === 'flatten') ? value : flatten
    return `/view/${encodeURIComponent(profileId)}?bottomUp=${newBottomUp}&flatten=${newFlatten}`
  }
  return <nav class='nav nav-pills flex-column flex-sm-row'>
    <div class='navbar-brand'>Profile</div>
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
    <a href={`/search?task_uuid=${encodeURIComponent(task_uuid)}`}
      class='nav-link ml-auto'>
      View Related
    </a>
  </nav>
}
