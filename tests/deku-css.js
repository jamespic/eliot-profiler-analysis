'use strict'
import _ from 'lodash'

export default function css (el, selector) {
  return selector.split(' ').reduce((els, select) => {
    if (select === '#text') {
      return els.map(extractText)
    } else if (select.startsWith('.')) {
      let classes = select.substring(1).split('.')
      return _.flatMap(els, el => findAll(el, el => classes.every(
        clazz => ((el.attributes || {}).class || '').split(' ').includes(clazz)
      )))
    } else if (select.startsWith('#')) {
      let id = select.substring(1)
      return _.flatMap(els, el => findAll(el, el => el.attributes.id === id))
    } else {
      return _.flatMap(els, el => findAll(el,
        el => el.type === select || el.type === '#thunk' && el.component.name === select
      ))
    }
  }, [el])
}

export function extractText (el) {
  if (el.type === '#text') return el.nodeValue
  else if (el.children) return el.children.map(extractText).join('')
  else return ''
}

export function findAll (el, predicate) {
  let result = []
  if (predicate(el)) result = [el]
  if (el.children) result = result.concat(_.flatMap(el.children, e => findAll(e, predicate)))
  return result
}
