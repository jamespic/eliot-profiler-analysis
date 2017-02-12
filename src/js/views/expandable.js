import {element} from './deku-seamless-immutable'
import FontAwesome from './font-awesome'
import {Actions} from '../actions'

export default function Expandable ({children, props: {header}, context: {expandedCallGraphNodes}, path, dispatch}) {
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
