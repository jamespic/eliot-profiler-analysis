'use strict'
import {element} from './deku-seamless-immutable'
import {Actions} from './actions'
import {stripMessageBarriers} from './callgraph-helpers'
import _ from 'lodash'

export function ViewProfile ({props: {profileId, data}}) {
  if (data) return <ul><li><CallGraph callGraph={stripMessageBarriers(data)} totalTime={data.time} /></li></ul>
  else return <h1>Loading...</h1>
}

export function ViewSearch ({props: {params}}) {
  return <h1>Searching for {JSON.stringify(params)}</h1>
}

export function CallGraph ({props: {callGraph, totalTime}, context: {expandedCallGraphNodes}, path, dispatch}) {
  return <div>
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
        <dl>
          {
            _.chain(callGraph)
            .toPairs()
            .filter(([k, v]) => (k !== 'children') && (k !== 'instruction'))
            .flatMap(([k, v]) => [
              <dt>{k}</dt>,
              <dd>{(typeof v === 'object') ? JSON.stringify(v) : v}</dd>
            ])
            .value()
          }
        </dl>
        {
          callGraph.children
          ? <ul>
            {callGraph.children.map(c => <li><CallGraph callGraph={c} totalTime={totalTime} /></li>)}
          </ul>
          : null
        }
      </div>
      : null
    }
  </div>
}

export function DataBar ({props: {redSize, yellowSize, totalSize}, children}) {
  return <div style={'position: relative; width: 100%'}>
    <span style={`position: absolute; top: 0px; left: 0px; z-index: 0; display: block; height: 100%; width: ${redSize / totalSize * 100}%; background-color: rgba(203, 75, 22, 0.4); text-align: right;`} />
    <span style={`position: absolute; top: 0px; left: 0px; z-index: 0; display: block; height: 100%; width: ${yellowSize / totalSize * 100}%; background-color: rgba(203, 203, 22, 0.4); text-align: right;`} />
    {children}
  </div>
}
