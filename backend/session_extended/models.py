# models.py
from user_sessions.models import Session
import pprint

class Session(Session):
    list_display = ['session_key', 'expire_date']


# class SessionProxy(Session):cdscdscd
#     class Meta:
#         proxy = True

#     @property
#     def decoded_data(self):
#         return self.get_decoded()

#     @property
#     def formatted_data(self):
#         return pprint.pformat(self.decoded_data)

# # admin.py
# from django.contrib import admin
# from django.utils.html import format_html
# from .models import SessionProxy

# @admin.register(SessionProxy)
# class SessionAdmin(admin.ModelAdmin):
#     list_display = ['session_key', 'expire_date']
#     readonly_fields = ['formatted_data']
    
#     fieldsets = [
#         ('Session Info', {'fields': ['session_key', 'expire_date']}),
#         ('Session Data', {'fields': ['formatted_data']}),
#     ]

#     def formatted_data(self, obj):
#         return format_html('<pre>{}</pre>', obj.formatted_data)
#     formatted_data.short_description = 'Decoded Session Data'