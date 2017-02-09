'use strict'
import {defaultMemoize} from 'reselect'

export const selfGraph = defaultMemoize(function selfGraph (callGraph) {
  let keyedGraph = {}
  function addToGraph (parentPath, child) {
    let newPath = parentPath
    if (child.instruction) {
      newPath = parentPath.concat([child.instruction])
      let selfTime = child.self_time
      let subGraph = keyedGraph
      for (let i = newPath.length - 1; i >= 0; --i) {
        let instruction = newPath[i]
        let graphNode = subGraph[instruction]
        if (!graphNode) {
          graphNode = {self_time: 0, callers: {}}
          subGraph[instruction] = graphNode
        }
        graphNode.self_time += selfTime
        subGraph = graphNode.callers
      }
    }
    if (child.children) {
      child.children.forEach(function (subchild) {
        addToGraph(newPath, subchild)
      })
    }
  }
  addToGraph([], callGraph)

  function sortSelfGraph (selfGraph) {
    var newGraph = []
    for (let key in selfGraph) {
      let item = selfGraph[key]
      item.instruction = key
      item.callers = sortSelfGraph(item.callers)
      newGraph.push(selfGraph[key])
    }
    newGraph.sort((a, b) => b.self_time - a.self_time)
    return newGraph
  }

  return sortSelfGraph(keyedGraph)
})


export const stripMessageBarriers = defaultMemoize(function stripMessageBarriers (callGraph, flatten) {
  var result = Object.assign({}, callGraph)
  if (result.instruction && flatten) result.instruction = flatten(result.instruction)
  var newChildren = []
  function visitChild (child) {
    if (child.message == null) {
      if (child.instruction && flatten && flatten(child.instruction) === result.instruction) {
        result.self_time += child.self_time
        if (child.children) child.children.forEach(visitChild)
      } else {
        let match = newChildren.find(m => m.instruction === child.instruction)
        if (match) {
          match.self_time += child.self_time
          match.time += child.time
          if (child.start_time < match.start_time) match.start_time = child.start_time
          if (child.end_time > match.end_time) match.end_time = child.end_time
          if (child.children != null) match.children = (match.children || []).concat(child.children)
        } else {
          var newChild = Object.assign({}, child)
          newChildren.push(newChild)
        }
      }
    }
  }
  if (callGraph.children != null) {
    callGraph.children.forEach(visitChild)
  }
  result.children = newChildren.map(child => stripMessageBarriers(child, flatten))
  return result
})

export function flattenByLine (instruction) { return instruction }
// FIXME: This will break for files with colons
export function flattenByMethod (instruction) {
  return instruction.split(':').slice(0, 2).join(':')
}
export function flattenByFile (instruction) {
  return instruction.split(':')[0]
}
