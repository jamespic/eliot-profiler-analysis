'use strict'
import {element} from './deku-seamless-immutable'
import {Actions, Constants} from './actions'
import {stripMessageBarriers, flattenByLine, flattenByMethod, flattenByFile, selfGraph, summariseCallGraph} from './callgraph-helpers'
import {flow, toPairs, flatMap, filter} from 'lodash/fp'
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
  if (bottomUp) return <BottomUpCallGraph callGraph={selfGraph(data)} totalTime={data.time} />
  else return <ul><CallGraph callGraph={data} totalTime={data.time} /></ul>
}

export function CallGraph ({props: {callGraph, totalTime}, context: {expandedCallGraphNodes}, path, dispatch}) {
  return <li>
    <div
      onClick={() => dispatch(Actions.TOGGLE_CALL_GRAPH_NODE(path))}>
      <DataBar redSize={callGraph.time - callGraph.self_time} yellowSize={callGraph.self_time} totalSize={totalTime}>
        {
          callGraph.instruction ||
          (callGraph.message || {}).action_type ||
          (callGraph.source && `${callGraph.source} (Thread ${callGraph.thread}, Task ${callGraph.task_uuid})`) ||
          ''
        }
      </DataBar>
    </div>
    {
      expandedCallGraphNodes[path]
      ? <div>
        <dl class='dl-horizontal'>
          {
            flow(
              toPairs,
              filter(([k, v]) => (k !== 'children') && (k !== 'instruction')),
              flatMap(([k, v]) => [
                <dt>{k}</dt>,
                <dd>{(typeof v === 'object') ? JSON.stringify(v) : v}</dd>
              ])
            )(callGraph)
          }
        </dl>
        {
          callGraph.children
          ? <ul>
            {callGraph.children.map(c => <CallGraph callGraph={c} totalTime={totalTime} />)}
          </ul>
          : null
        }
      </div>
      : null
    }
  </li>
}

export function BottomUpCallGraph ({props: {callGraph, totalTime}}) {
  return <ul>
    {
      callGraph.map(item =>
        <BottomUpCallGraphItem item={item} totalTime={totalTime} />
      )
    }
  </ul>
}

function BottomUpCallGraphItem ({props: {item: {instruction, self_time, callers}, totalTime}, context: {expandedCallGraphNodes}, path, dispatch}) {
  return <li>
    <div onClick={() => dispatch(Actions.TOGGLE_CALL_GRAPH_NODE(path))}>
      <DataBar redSize={self_time} totalSize={totalTime}>
        {instruction} ({self_time} seconds)
      </DataBar>
    </div>
    {
      (expandedCallGraphNodes[path] && callers)
      ? <BottomUpCallGraph callGraph={callers} totalTime={totalTime} />
      : null
    }
  </li>
}

export function DataBar ({props: {redSize, yellowSize, totalSize}, children}) {
  return <div style={'position: relative; width: 100%'}>
    <div style={`position: absolute; top: 0px; left: 0px; z-index: 0; height: 100%; width: 100%;`}>
      <div style={`height: 100%; width: ${redSize / totalSize * 100}%; background-color: rgba(203, 75, 22, 0.4); float: left;`} />
      <div style={`height: 100%; width: ${yellowSize / totalSize * 100}%; background-color: rgba(203, 203, 22, 0.4); float: left;`} />
    </div>
    {children}
  </div>
}
