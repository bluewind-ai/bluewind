# Create your models here.
from django.db import models

from base_admin.admin import InWorkspace
from unfold import admin
from workspaces.models import WorkspaceRelated


# Models
class Author(WorkspaceRelated):
    name = models.CharField(max_length=100)
    bio = models.TextField()

    def __str__(self):
        return self.name


class Book(WorkspaceRelated):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(Author, on_delete=models.CASCADE, related_name="books")
    publication_date = models.DateField()
    isbn = models.CharField(max_length=13)

    def __str__(self):
        return self.title


# Admin
class BookInline(admin.TabularInline):
    model = Book
    extra = 1


class AuthorAdmin(InWorkspace):
    list_display = ("name",)
    inlines = [BookInline]


class BookAdmin(InWorkspace):
    list_display = ("title", "author", "publication_date", "isbn")
    list_filter = ("author", "publication_date")
    search_fields = ("title", "author__name", "isbn")
