'use strict'
import {element} from './deku-seamless-immutable'
import {Actions, Constants} from './actions'
import {stripMessageBarriers, flattenByLine, flattenByMethod, flattenByFile, selfGraph, summariseCallGraph} from './callgraph-helpers'
import _ from 'lodash'

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
    <div style='position: relative; margin-left: 2em'>
      <span style='position: absolute; left: -1.5em'
        onClick={() => dispatch(Actions.TOGGLE_CALL_GRAPH_NODE(path))}>
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
    <div>
      <dl class='row'>
        {
          _.flatMap(callGraph, (v, k) =>
            (k === 'children' || k === 'instruction') ? []
            : [
              <dt class='col-sm-2'>{k}</dt>,
              <dd class='col-sm-10' style='margin-bottom: 0'>
                {(typeof v === 'object') ? JSON.stringify(v) : v}
              </dd>
            ]
          )
        }
      </dl>
      {
        _.map(callGraph.children, c => <CallGraph callGraph={c} totalTime={totalTime} />)
      }
    </div>
  </Expandable>
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
  return <div style={'position: relative; width: 100%'}>
    <div style={`position: absolute; top: 0px; left: 0px; z-index: -1; height: 100%; width: 100%;`}>
      <div style={`height: 100%; width: ${mainSize / totalSize * 100}%; background-color: #ffd6ce; float: left;`} />
      <div style={`height: 100%; width: ${extraSize / totalSize * 100}%; background-color: #ceeaff; float: left;`} />
    </div>
    {children}
  </div>
}
