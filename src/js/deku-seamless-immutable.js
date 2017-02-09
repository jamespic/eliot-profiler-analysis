import {element as dekuElement} from 'deku'

export function element () {
  let result = dekuElement.apply(undefined, arguments)
  result.__immutable_invariants_hold = true
  return result
}
