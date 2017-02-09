import Immutable from 'seamless-immutable'

export function selfGraph (callGraph) {
  var keyedGraph = {}
  function addToGraph (parentPath, child) {
    var newPath = parentPath
    if (child.instruction) {
      newPath = parentPath.concat([child.instruction])
      var selfTime = child.self_time
      var subGraph = keyedGraph
      newPath.reverse().forEach(function(instruction) {
        var graphNode = subGraph[instruction]
        if (!graphNode) {
          graphNode = {self_time: 0, children: {}}
          subGraph[instruction] = graphNode
        }
        graphNode.self_time += selfTime
        subGraph = graphNode.children
      })
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
    for (var key in selfGraph) {
      var item = selfGraph[key]
      item.instruction = key
      item.children = sortSelfGraph(item.children)
      newGraph.push(selfGraph[key])
    }
    newGraph.sort((a, b) => b.self_time - a.self_time)
    return newGraph
  }

  return sortSelfGraph(keyedGraph)
}

export function stripMessageBarriers (callGraph) {
  var result = Object.assign({}, callGraph)
  var newChildren = []
  if (callGraph.children != null) {
    callGraph.children.forEach((child) => {
      if (child.message == null) {
        var match = newChildren.find(m => m.instruction === child.instruction)
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
    })
  }
  result.children = newChildren.map(stripMessageBarriers)
  return result
}
