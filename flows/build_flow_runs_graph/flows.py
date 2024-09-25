import logging

from flow_runs.models import FlowRun

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


import logging
from datetime import datetime

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


def build_flow_runs_graph(flow_run, flow_run_1):
    nodes = []
    edges = []
    node_id_counter = 1
    processed_flow_runs = set()

    def serialize_datetime(dt):
        return dt.isoformat() if isinstance(dt, datetime) else dt

    def add_node(label, status, extra_data=None):
        nonlocal node_id_counter
        node = {"id": node_id_counter, "label": label, "status": status}
        if extra_data:
            node.update({k: serialize_datetime(v) for k, v in extra_data.items()})
        nodes.append(node)
        node_id_counter += 1
        return node["id"]

    def add_flow_run_and_parents(flow_run, parent_id=None):
        if flow_run.id in processed_flow_runs:
            return None

        processed_flow_runs.add(flow_run.id)
        extra_data = {
            "executed_at": flow_run.executed_at,
            "user": str(flow_run.user),
            "workspace": str(flow_run.workspace),
        }
        flow_run_id = add_node(flow_run.flow.name, flow_run.status, extra_data)

        if parent_id is not None:
            edges.append({"from": parent_id, "to": flow_run_id})

        if flow_run.parent:
            parent_flow_run_id = add_flow_run_and_parents(flow_run.parent, flow_run_id)
            if parent_flow_run_id:
                edges.append({"from": parent_flow_run_id, "to": flow_run_id})

        return flow_run_id

    # Add start node
    start_id = add_node("Start", "COMPLETED")

    # Add flow_run and its parents
    flow_run_id = add_flow_run_and_parents(flow_run)

    # Connect start node to the main flow_run
    if flow_run_id:
        edges.append({"from": start_id, "to": flow_run_id})

    # Add flow_run_1 and its parents
    flow_run_1_id = add_flow_run_and_parents(flow_run_1)

    # Connect flow_run_1 to the graph if it's not already connected
    if flow_run_1_id and flow_run_1_id != flow_run_id:
        edges.append({"from": start_id, "to": flow_run_1_id})

    # Add end node
    end_id = add_node("End", "COMPLETED")

    # Connect end node to all leaf nodes (nodes with no outgoing edges)
    leaf_nodes = set(node["id"] for node in nodes) - set(edge["from"] for edge in edges)
    for leaf_node in leaf_nodes:
        if leaf_node != end_id:
            edges.append({"from": leaf_node, "to": end_id})
    flow_run.status = FlowRun.Status.COMPLETED_READY_FOR_APPROVAL
    return {"nodes": nodes, "edges": edges}
