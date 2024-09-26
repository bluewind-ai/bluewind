from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render


@staff_member_required
def admin_next_view(request):
    # Add your view logic here
    context = {
        "title": "Next Steps",
        # Add more context variables as needed
    }
    return render(request, "admin/next.html", context)
