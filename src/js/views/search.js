import {element} from './deku-seamless-immutable'
import {humanizeSeconds, humanizeMoment} from './utils'
import _ from 'lodash'

export default function Search ({props: {profiles}}) {
  return <table class='table'>
    <thead>
      <th>Source</th>
      <th>Event</th>
      <th>Start Time</th>
      <th>Duration</th>
    </thead>
    <tbody>
      {
        _.map(profiles, (callGraph, key) => <tr>
          <td>{callGraph.source}</td>
          <td>
            <a href={`/view/${encodeURIComponent(key)}`}>
              {
                callGraph.actions.join(', ') || callGraph.instructions.join(', ') || callGraph.task_uuid
              }
            </a>
          </td>
          <td>{humanizeMoment(callGraph.start_time)}</td>
          <td>{humanizeSeconds(callGraph.time)}</td>
        </tr>)
      }
    </tbody>
  </table>
}
