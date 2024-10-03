from django.shortcuts import get_object_or_404
from django.urls import reverse

from function_calls.models import FunctionCall


def get_function_call_whole_tree_v1(function_call_id):
    function_call = get_object_or_404(FunctionCall, id=function_call_id)

    def format_node(node):
        change_url = reverse(
            "admin:function_calls_functioncall_change", args=[node["id"]]
        )
        dummy_link = f"https://example.com/dummy/{node['id']}"

        # Get the FunctionCall object to access the get_status_emoji method
        node_obj = FunctionCall.objects.get(id=node["id"])
        emoji = node_obj.get_status_emoji()

        return {
            "id": str(node["id"]),
            "text": f"{node['function_name']} {emoji}",
            "children": [format_node(child) for child in node["children"]],
            "data": {"change_url": change_url, "dummy_link": dummy_link},
        }

    tree_data = format_node(function_call.get_whole_tree())
    return function_call, [tree_data]
