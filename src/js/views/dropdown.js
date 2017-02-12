import {element} from './deku-seamless-immutable'
import {Actions} from '../actions'

export default function DropDown ({children, path, dispatch, props: {title}, context: {expandedDropDown}}) {
  let expanded = path === expandedDropDown
  return <li id={path} class={`nav-item dropdown ${expanded ? 'show' : ''}`}>
    <a class='nav-link dropdown-toggle'
      id={`dropdown-button.${path}`}
      role='button'
      aria-haspopup='true'
      aria-expanded={String(expanded)}
      onClick={e => {
        dispatch(Actions.SET_VISIBLE_DROPDOWN(expanded ? null : path))
        e.preventDefault()
      }}>
      {title}
    </a>
    <div class='dropdown-menu'>
      {children}
    </div>
  </li>
}
