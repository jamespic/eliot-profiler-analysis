'use strict'
import {element} from './deku-seamless-immutable'
import {Actions, Constants} from './actions'
import {stripMessageBarriers, flattenByLine, flattenByMethod, flattenByFile, selfGraph, summariseCallGraph} from './callgraph-helpers'
import _ from 'lodash'
import humanizeDuration from 'humanize-duration'
import moment from 'moment'

export function Main ({children}) {
  return <div class='container-fluid'>
    {children}
  </div>
}

export function Router ({context: {lastNavigation, profiles}}) {
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
      <table class='table'>
        <thead>
          <th>Event</th>
          <th>Start Time</th>
          <th>Duration</th>
        </thead>
        <tbody>
          {
            _.map(profiles.results, (callGraph, key) => <tr>
              <td>
                <a href={`/view/${encodeURIComponent(key)}`}>
                  {summariseCallGraph(callGraph)}
                </a>
              </td>
              <td>{callGraph.start_time}</td>
              <td>{callGraph.time}</td>
            </tr>)
          }
        </tbody>
      </table>
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
  return <div>
    <nav class='nav nav-pills flex-column flex-sm-row py-2'>
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
    {
      bottomUp
      ? <BottomUpCallGraph key='bottomUpGraph' callGraph={selfGraph(data)} totalTime={data.time} />
      : <CallGraph key='topDownGraph' callGraph={data} totalTime={data.time} />
    }
  </div>
}

export function FontAwesome ({props: {icon, options}}) {
  let clazz = `fa fa-${icon} `
  switch (typeof options) {
    case 'string':
      options = options.split(' ')
    case 'object': // eslint-disable-line
      clazz += options.map(o => 'fa-' + o).join(' ')
  }
  return <i class={clazz} />
}

export function Expandable ({children, props: {header}, context: {expandedCallGraphNodes}, path, dispatch}) {
  let expanded = expandedCallGraphNodes[path]
  return <div>
    <div class='expandable'>
      <span class='expander' onClick={() => dispatch(Actions.TOGGLE_CALL_GRAPH_NODE(path))}>
        <FontAwesome icon={expanded ? 'minus-square' : 'plus-square'} />
      </span>
      {header}
      {expanded ? children : null}
    </div>
  </div>
}

export function CallGraph ({props: {callGraph, totalTime, expanded}}) {
  let header = <DataBar mainSize={callGraph.time - callGraph.self_time} extraSize={callGraph.self_time} totalSize={totalTime}>
    <span class='instruction'>
      {
        callGraph.instruction ||
        (callGraph.message || {}).action_type ||
        (callGraph.source && `${callGraph.source} (Thread ${callGraph.thread}, Task ${callGraph.task_uuid})`) ||
        ''
      }
    </span>
  </DataBar>
  return <Expandable header={header}>
    <div class='call-graph-details'>
      <CallGraphSummary callGraph={callGraph} />
      {
        _.map(callGraph.children, c => <CallGraph callGraph={c} totalTime={totalTime} />)
      }
    </div>
  </Expandable>
}

function humanize (seconds) {
  return humanizeDuration(
    seconds * 1000,
    {
      largest: 2,
      round: true,
      units: ['y', 'mo', 'd', 'h', 'm', 's', 'ms'],
      language: (typeof window !== 'undefined') ? window.navigator.language.split('-')[0] : 'en'
    }
  )
}

export function CallGraphSummary ({props: {callGraph}}) {
  let extraInfo = _.flatMap(callGraph, (v, k) => {
    switch (k) {
      case 'children':
      case 'instruction':
      case 'start_time':
      case 'end_time':
      case 'self_time':
      case 'time':
        return []
      default:
        return [
          <dt>{k}</dt>,
          <dd>{(typeof v === 'object') ? JSON.stringify(v) : v}</dd>
        ]
    }
  })
  return <div>
    <small>
      {
        humanize(callGraph.time)} ({humanize(callGraph.self_time)
      } self time) — {
        moment(callGraph.start_time).format('LTS l')} - {moment(callGraph.end_time).format('LTS l')
      }
    </small>
    {extraInfo.length > 0 ? <dl>{extraInfo}</dl> : null}
  </div>
}

export function BottomUpCallGraph ({props: {callGraph, totalTime}}) {
  return <div>
    {
      callGraph.map(({instruction, self_time, callers}) =>
        <Expandable header={
          <DataBar mainSize={self_time} totalSize={totalTime}>
            <span class='instruction'>
              {instruction}
            </span> <small>
              {humanize(self_time)} self time
            </small>
          </DataBar>
        }>
          <BottomUpCallGraph callGraph={callers} totalTime={totalTime} />
        </Expandable>
      )
    }
  </div>
}

export function DataBar ({props: {mainSize, extraSize, totalSize}, children}) {
  return <div class='data-bar-outer'>
    <div class='data-bar-inner'>
      <div style={`width: ${mainSize / totalSize * 100}%;`} class='data-bar-main' />
      <div style={`width: ${extraSize / totalSize * 100}%;`} class='data-bar-extra' />
    </div>
    {children}
  </div>
}

export function DropDown ({children, path, dispatch, props: {title}, context: {expandedDropDown}}) {
  let expanded = path === expandedDropDown
  return <li id={path} class={`nav-item dropdown ${expanded ? 'show' : ''}`}>
    <a class='nav-link dropdown-toggle'
      id={`dropdown-button.${path}`}
      data-toggle='dropdown'
      role='button'
      aria-haspopup='true'
      aria-expanded={String(expanded)}
      onClick={e => {
        dispatch(Actions.SET_VISIBLE_DROPDOWN(expanded ? null : path))
        e.preventDefault()
      }}>
      {title}
    </a>
    <div class='dropdown-menu'>
      {children}
    </div>
  </li>
}
