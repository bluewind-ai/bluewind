from django.contrib import admin
from django.db import models

from treenode.admin import TreeNodeModelAdmin
from treenode.models import TreeNodeModel


class Category(TreeNodeModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    treenode_display_field = "name"

    class Meta(TreeNodeModel.Meta):
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


@admin.register(Category)
class CategoryAdmin(TreeNodeModelAdmin):
    list_display = ("name", "description")
    search_fields = ("name", "description")
