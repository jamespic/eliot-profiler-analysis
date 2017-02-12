import {element} from './deku-seamless-immutable'
import FontAwesome from './font-awesome'

export default function Throbber () {
  return <div class='py-5 text-center'>
    <FontAwesome icon='spinner' pulse opts={['5x']} />
  </div>
}
