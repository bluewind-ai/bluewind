from django.contrib import admin
from django.urls import path
from django.template.response import TemplateResponse
from .models import DBGraph

class DBGraphAdmin(admin.ModelAdmin):
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('db-graph/', self.admin_site.admin_view(self.db_graph_view), name='db_graph_view'),
        ]
        return custom_urls + urls

    def db_graph_view(self, request):
        context = dict(
            self.admin_site.each_context(request),
            title="Database Graph"
        )
        return TemplateResponse(request, "admin/db_graph.html", context)

admin.site.register(DBGraph, DBGraphAdmin)