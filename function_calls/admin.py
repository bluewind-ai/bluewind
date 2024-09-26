from django.shortcuts import render
from django.urls import path

from base_model_admin.admin import InWorkspace


class FunctionCall(InWorkspace):
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path("next/", self.admin_view(self.next_view), name="admin_next"),
        ]
        return custom_urls + urls

    def next_view(self, request):
        context = {
            "title": "Next Steps",
            # Add more context variables as needed
        }
        return render(request, "admin/next.html", context)
