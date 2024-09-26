import logging

from flow_runs.models import FlowRun

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


import logging
from datetime import datetime

# Patch standard library
logger = logging.getLogger("django.not_used")  # noqa: F821


import logging

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

    def add_flow_run_and_parents(flow_run_1):
        if flow_run_1.id in processed_flow_runs:
            return None

        processed_flow_runs.add(flow_run_1.id)
        extra_data = {
            "executed_at": flow_run_1.executed_at,
            "user": str(flow_run_1.user),
            "workspace": str(flow_run_1.workspace),
        }
        flow_run_id = add_node(flow_run_1.flow.name, flow_run_1.status, extra_data)

        if flow_run_1.parent:
            parent_flow_run_id = add_flow_run_and_parents(flow_run_1.parent)
            if parent_flow_run_id:
                edges.append({"from": parent_flow_run_id, "to": flow_run_id})

        return flow_run_id

    add_flow_run_and_parents(flow_run_1)

    flow_run.status = FlowRun.Status.SUCCESSFUL
    return {"nodes": nodes, "edges": edges}
