import {element} from './deku-seamless-immutable'
import {summariseCallGraph} from './callgraph-helpers'
import {humanizeSeconds, humanizeMoment} from './utils'
import _ from 'lodash'

export default function Search ({props: {profiles}}) {
  return <table class='table'>
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
          <td>{humanizeMoment(callGraph.start_time)}</td>
          <td>{humanizeSeconds(callGraph.time)}</td>
        </tr>)
      }
    </tbody>
  </table>
}
