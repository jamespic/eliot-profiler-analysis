def reduce_call_graph(into, value):
    if value['time'] == 0:
        return
    into['time'] += value['time']
    into['self_time'] += value['self_time']
    if into['start_time'] is None or value['start_time'] < into['start_time']:
        into['start_time'] = value['start_time']
    if into['end_time'] is None or value['end_time'] > into['end_time']:
        into['end_time'] = value['end_time']
    if 'children' in value:
        existing_children = into['children']
        for child in value['children']:
            instruction = child['instruction']
            for existing_child in existing_children:
                if existing_child['instruction'] == instruction:
                    node = existing_child
                    break
            else:
                node = {
                    'instruction': instruction,
                    'time': 0,
                    'self_time': 0,
                    'start_time': None,
                    'end_time': None,
                    'children': []
                }
                existing_children.append(node)
            reduce_call_graph(node, child)


def combine_call_graphs(graphs):
    into = {
        'source': 'combined-graph',
        'time': 0,
        'self_time': 0,
        'start_time': None,
        'end_time': None,
        'children': []
    }
    for graph in graphs:
        reduce_call_graph(into, graph)
    return into
