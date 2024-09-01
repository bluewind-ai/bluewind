from django.urls import path
from django.contrib import admin
from .admin import DBGraphAdmin
from .models import DBGraph

app_name = "db_graph"

urlpatterns = [
    path("", DBGraphAdmin(DBGraph, admin.site).db_graph_view, name="db_graph_view"),
]
