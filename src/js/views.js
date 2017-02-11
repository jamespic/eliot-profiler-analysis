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
      return <ViewSearch params={lastNavigation.payload} profiles={profiles}/>
    case Constants.NAVIGATE_VIEW_PROFILE: {
      let {profileId, bottomUp, flatten} = lastNavigation.payload
      return <ViewProfile profileId={profileId} data={profiles.results[profileId]} bottomUp={bottomUp} flatten={flatten}/>
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
  if (bottomUp) return <BottomUpCallGraph key='bottomUpGraph' callGraph={selfGraph(data)} totalTime={data.time} />
  else return <CallGraph key='topDownGraph' callGraph={data} totalTime={data.time} />
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
    {
      callGraph.instruction ||
      (callGraph.message || {}).action_type ||
      (callGraph.source && `${callGraph.source} (Thread ${callGraph.thread}, Task ${callGraph.task_uuid})`) ||
      ''
    }
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
  return <dl>
    <dt>Timings</dt>
    <dd>{moment(callGraph.start_time).format('LTS l')} to {moment(callGraph.end_time).format('LTS l')}</dd>
    <dt>Duration</dt>
    <dd>
      {humanize(callGraph.time)} ({humanize(callGraph.self_time)} self time)
    </dd>
    {
      _.flatMap(callGraph, (v, k) => {
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
    }
  </dl>
}

export function BottomUpCallGraph ({props: {callGraph, totalTime}}) {
  return <div>
    {
      callGraph.map(({instruction, self_time, callers}) =>
        <Expandable header={
          <DataBar mainSize={self_time} totalSize={totalTime}>
            {instruction} ({self_time} seconds)
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
