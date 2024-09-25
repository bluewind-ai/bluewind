import logging

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def generate_graph_data(flow_run):
    nodes = [
        {"id": 1, "label": "Start"},
        {"id": 2, "label": flow_run.flow.name},
        {"id": 3, "label": "Step 1"},
        {"id": 4, "label": "Step 2"},
        {"id": 5, "label": "End"},
    ]
    edges = [
        {"from": 1, "to": 2},
        {"from": 2, "to": 3},
        {"from": 3, "to": 4},
        {"from": 4, "to": 5},
    ]
    return {"nodes": nodes, "edges": edges}
