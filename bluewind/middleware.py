# from django.shortcuts import redirect
# from django.urls import reverse

# class RedirectMiddleware:
#     def __init__(self, get_response):
#         self.get_response = get_response

#     def __call__(self, request):
#         if request.path == '/' and not request.user.is_authenticated:
#             return redirect(reverse('admin:index'))
#         return self.get_response(request)
