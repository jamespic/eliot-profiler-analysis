import {element} from './deku-seamless-immutable'
import {humanizeSeconds, humanizeMoment} from './utils'
import DataBar from './databar'
import Expandable from './expandable'
import _ from 'lodash'

export default function CallGraph ({props: {callGraph, totalTime, expanded}}) {
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
  let timingText = `${humanizeSeconds(callGraph.time)} (${humanizeSeconds(callGraph.self_time)} self time) — ${humanizeMoment(callGraph.start_time)} - ${humanizeMoment(callGraph.end_time)}`
  return <Expandable header={header}>
    <div class='call-graph-details'>
      <div>
        <small>
          {timingText}
        </small>
        {extraInfo.length > 0 ? <dl>{extraInfo}</dl> : null}
      </div>
      {
        _.map(callGraph.children, c => <CallGraph callGraph={c} totalTime={totalTime} />)
      }
    </div>
  </Expandable>
}
