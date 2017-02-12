import {element} from './deku-seamless-immutable'
import Expandable from './expandable'
import DataBar from './databar'
import {humanizeSeconds} from './utils'

export default function BottomUpCallGraph ({props: {callGraph, totalTime}}) {
  return <div>
    {
      callGraph.map(({instruction, self_time, callers}) =>
        <Expandable header={
          <DataBar mainSize={self_time} totalSize={totalTime}>
            <span class='instruction'>
              {instruction}
            </span> <small>
              {humanizeSeconds(self_time)} self time
            </small>
          </DataBar>
        }>
          <BottomUpCallGraph callGraph={callers} totalTime={totalTime} />
        </Expandable>
      )
    }
  </div>
}
