# from django.contrib.auth import login
# from django.shortcuts import redirect
# from django.contrib.auth.views import LoginView

# class CustomLoginView(LoginView):
#     template_name = 'admin/login.html'  # Using admin login template

#     def form_valid(self, form):
#         login(self.request, form.get_user())
#         user = form.get_user()
#         return redirect(f'/admin/workspace/{user.id}/')