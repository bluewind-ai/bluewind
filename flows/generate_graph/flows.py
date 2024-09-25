import logging

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def generate_graph_data(flow_run):
    nodes = [
        {"id": 1, "label": "Start"},
        {"id": 2, "label": flow_run.flow.name},
        {"id": 3, "label": "End"},
    ]
    edges = [{"from": 1, "to": 2}, {"from": 2, "to": 3}]
    return {"nodes": nodes, "edges": edges}
