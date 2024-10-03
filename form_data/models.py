# # Create your models here.
# from django.db import models


# class FormData(models.Model):
#     form = models.ForeignKey(
#         "forms.Form", on_delete=models.CASCADE, related_name="form_data"
#     )
#     data = models.JSONField(default=dict, blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def __str__(self):
#         return f"FormData for {self.form.name}"
