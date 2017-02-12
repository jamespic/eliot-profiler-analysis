import {element} from './deku-seamless-immutable'

export default function FontAwesome ({props: {icon, opts = [], ...options}}) {
  let clazz = `fa fa-${icon} `
  clazz += Object.keys(options).concat(opts).map(o => 'fa-' + o).join(' ')
  return <i class={clazz} />
}
