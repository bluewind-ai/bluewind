# import inspect
# import logging
# import os
# import re
# import textwrap

# from django.apps import apps
# from django.core.exceptions import ImproperlyConfigured

# from admin_autoregister.whitelist import MODEL_WHITELIST

# logger = logging.getLogger(__name__)


# logger = logging.getLogger(__name__)


# def check_and_fix_model_save_method():
#     logger.info("Starting check_and_fix_model_save_method")
#     issues = []
#     fixes = []

#     excluded_apps = [
#         "allauth.account",
#         "allauth.socialaccount",
#         "django.contrib.auth",
#         "django.contrib.admin",
#         "django.contrib.contenttypes",
#         "django.contrib.sessions",
#         "django.contrib.messages",
#         "django.contrib.staticfiles",
#     ]

#     for app_config in apps.get_app_configs():
#         if app_config.name in excluded_apps:
#             continue

#         models = list(app_config.get_models())

#         if len(models) > 1:
#             file_paths = [get_model_file_path(model) for model in models]
#             unique_file_paths = set(file_paths)
#             file_locations = ", ".join(unique_file_paths)
#             issues.append(
#                 f"Multiple models found in app {app_config.name}. Only one model per app is allowed. "
#                 f"File locations: {file_locations}"
#             )
#             continue

#         for model in models:
#             logger.debug(f"Checking model: {app_config.name}.{model.__name__}")

#             if model._meta.object_name in MODEL_WHITELIST or model._meta.abstract:
#                 continue

#             file_path = get_model_file_path(model)
#             module_name = get_module_name(file_path)

#             expected_save_method = generate_expected_save_method(module_name)
#             required_imports = generate_required_imports(module_name)

#             with open(file_path, "r") as file:
#                 content = file.read()

#             save_pattern = re.compile(
#                 r"def\s+save\s*\(.*?\):.*?(?=\n\s*def|\Z)", re.DOTALL
#             )
#             save_match = save_pattern.search(content)

#             if not save_match:
#                 fixes.append(
#                     (
#                         file_path,
#                         model.__name__,
#                         expected_save_method,
#                         None,
#                         required_imports,
#                     )
#                 )
#             elif save_match.group(0).strip() != expected_save_method.strip():
#                 fixes.append(
#                     (
#                         file_path,
#                         model.__name__,
#                         expected_save_method,
#                         save_match.group(0),
#                         required_imports,
#                     )
#                 )

#             module_dir = os.path.dirname(file_path)
#             required_files = [
#                 "before_create.py",
#                 "before_update.py",
#                 "after_create.py",
#                 "after_update.py",
#             ]

#             for required_file in required_files:
#                 action_file_path = os.path.join(module_dir, required_file)
#                 if not os.path.exists(action_file_path):
#                     create_action_file(action_file_path, required_file)
#                     logger.info(f"Created missing action file: {action_file_path}")

#     if issues:
#         for issue in issues:
#             logger.error(issue)
#         raise ImproperlyConfigured("\n\n".join(issues))

#     if fixes:
#         apply_fixes(fixes)
#         logger.info(f"Applied {len(fixes)} fixes to save methods.")
#     else:
#         logger.info("All models have the correct save method.")


# def generate_expected_save_method(module_name):
#     return f"""def save(self, *args, **kwargs):
#         is_new = self.pk is None
#         if is_new:
#             {module_name}_before_create(self)
#         else:
#             {module_name}_before_update(self)
#         super().save(*args, **kwargs)
#         if is_new:
#             {module_name}_after_create(self)
#         else:
#             {module_name}_after_update(self)"""


# def generate_required_imports(module_name):
#     return f"""from {module_name}.before_create import {module_name}_before_create
# from {module_name}.before_update import {module_name}_before_update
# from {module_name}.after_create import {module_name}_after_create
# from {module_name}.after_update import {module_name}_after_update"""


# def get_model_file_path(model):
#     try:
#         file_path = inspect.getfile(model)
#         return os.path.abspath(file_path)
#     except TypeError:
#         return "Unknown file path"


# def get_module_name(file_path):
#     directory = os.path.dirname(file_path)
#     module_name = os.path.basename(directory)
#     return module_name


# def apply_fixes(fixes):
#     for (
#         file_path,
#         model_name,
#         expected_save_method,
#         existing_save_method,
#         required_imports,
#     ) in fixes:
#         with open(file_path, "r") as file:
#             content = file.read()

#         import_lines = required_imports.split("\n")
#         for import_line in import_lines:
#             if import_line not in content:
#                 content = import_line + "\n" + content

#         if existing_save_method:
#             existing_save_lines = existing_save_method.split("\n")
#             indentation = len(existing_save_lines[0]) - len(
#                 existing_save_lines[0].lstrip()
#             )
#             expected_save_indented = textwrap.indent(
#                 expected_save_method, " " * indentation
#             )

#             content = content.replace(
#                 existing_save_method, expected_save_indented + "\n\n"
#             )
#         else:
#             class_pattern = re.compile(
#                 rf"class\s+{model_name}\s*\(.*?\):.*?(?=\n\S|\Z)", re.DOTALL
#             )
#             class_match = class_pattern.search(content)
#             if class_match:
#                 class_content = class_match.group(0)
#                 indentation = 4  # Assuming standard 4-space indentation
#                 expected_save_indented = textwrap.indent(
#                     expected_save_method, " " * indentation
#                 )
#                 new_class_content = (
#                     class_content.rstrip() + "\n\n" + expected_save_indented + "\n\n"
#                 )
#                 content = content.replace(class_content, new_class_content)

#         with open(file_path, "w") as file:
#             file.write(content)

#         logger.info(f"Updated save method for {model_name} in {file_path}")


# def create_action_file(file_path, file_name):
#     directory_name = os.path.basename(os.path.dirname(file_path))
#     function_name = f"{directory_name}_{file_name.replace('.py', '')}"
#     content = f"""def {function_name}(instance):
#     # Add your {function_name} logic here
#     pass
# """
#     with open(file_path, "w") as file:
#         file.write(content)


# logger.info("model_save_method.py module loaded")
