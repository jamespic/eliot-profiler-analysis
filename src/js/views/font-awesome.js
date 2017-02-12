import {element} from './deku-seamless-immutable'

export default function FontAwesome ({props: {icon, options}}) {
  let clazz = `fa fa-${icon} `
  switch (typeof options) {
    case 'string':
      options = options.split(' ')
    case 'object': // eslint-disable-line
      clazz += options.map(o => 'fa-' + o).join(' ')
  }
  return <i class={clazz} />
}
