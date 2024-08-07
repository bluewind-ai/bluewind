import json
from unittest import SkipTest
from uuid import UUID
import uuid
import factory
from django.contrib.auth import get_user_model
from model_mommy import mommy
from django.urls import reverse
from django.forms import CharField, model_to_dict
from django.test import TestCase, Client
from django.db.models import FileField

from workspaces.models import Workspace
from model_mommy.recipe import Recipe

workspace_recipe = Recipe(
    Workspace,
    name=factory.Sequence(lambda n: f"Workspace {n}")
)

class AdminTestMixIn(object):
    field_values = None
    model = None

    def create(self, commit=True, model=None, follow_fk=True, generate_fk=True, field_values=None):
        model = model or self.model
        field_values = field_values or self.field_values or {}
        instance = mommy.make(model, **field_values)
        return instance

    def create_user(self, is_staff=False, is_superuser=False, is_active=True):
        return self.create(model=get_user_model(), field_values=dict(
            is_staff=is_staff, is_superuser=is_superuser, is_active=is_active
        ))

    def setUp(self):
        super().setUp()
        get_user_model().objects.all().delete()  # Clear all users
        self.user = get_user_model().objects.create_superuser('admin', 'admin@test.com', 'password')
        self.client = Client()
        self.client.login(username='admin', password='password')
        self.workspace = workspace_recipe.make()
        session = self.client.session
        session['workspace_id'] = str(self.workspace.id)  # Convert UUID to string
        session.save()

class ModelAdminTestMixIn(AdminTestMixIn):
    add_status_code = 200
    changelist_status_code = 200
    change_status_code = 200
    delete_status_code = 200
    form_data_exclude_fields = ()
    form_data_update = {}
    skip_add = False
    skip_create = False
    skip_change = False
    skip_delete = False

    def get_form_data_update(self):
        return dict(self.form_data_update)

    def get_workspace_id(self):
        return self.workspace.id

    def get_add_url(self):
        return reverse('admin:{model._meta.app_label}_{model._meta.model_name}_add'.format(model=self.model), 
                    kwargs={'workspace_id': self.get_workspace_id()})
    
    def get_changelist_url(self):
        return reverse('admin:{app}_{model}_changelist'.format(
            app=self.model._meta.app_label,
            model=self.model._meta.model_name
        ), kwargs={'workspace_id': self.get_workspace_id()})

    def get_change_url(self, instance=None):
        instance = instance or self.create()
        return reverse('admin:{app}_{model}_change'.format(
            app=self.model._meta.app_label,
            model=self.model._meta.model_name
        ), kwargs={'workspace_id': self.get_workspace_id(), 'object_id': instance.pk})

    def get_delete_url(self, instance=None):
        instance = instance or self.create()
        return reverse('admin:{app}_{model}_delete'.format(
            app=self.model._meta.app_label,
            model=self.model._meta.model_name
        ), kwargs={'workspace_id': self.get_workspace_id(), 'object_id': instance.pk})

    def create_instance_data(self):
        instance = self.create()
        return {x: y for x, y in filter(lambda x: x[1], model_to_dict(instance).items())
                if x not in self.form_data_exclude_fields}

    def create_form_instance_data(self, response, instance_data=None):
        if not hasattr(response, 'context_data'):
            return {}  # Return empty dict if context_data is not available
        
        fields = {key: value.initial for key, value in
                response.context_data['adminform'].form.fields.items() if value.initial is not None}
        
        for formset in response.context_data.get('inline_admin_formsets', []):
            formset = list(formset)[0].formset
            for form in formset.forms + [formset.empty_form]:
                for field in form.visible_fields():
                    if field.value() is not None:
                        fields[field.html_name] = field.value()
                    elif field.field.required:
                        if isinstance(field.field, FileField):
                            fields[field.html_name] = None
                        elif isinstance(field.field, CharField):
                            max_length = field.field.max_length or 10
                            fields[field.html_name] = f"Sample{field.label[:max_length-6]}"
                        else:
                            fields[field.html_name] = f"Sample {field.label}"
            
            for key, value in formset.management_form.initial.items():
                fields[f'{formset.prefix}-{key}'] = value
        
        fields.update(instance_data or self.create_instance_data())
        return fields

    def test_changelist_view(self):
        response = self.client.get(self.get_changelist_url())
        self.assertEqual(response.status_code, self.changelist_status_code)

    def test_add_view(self):
        if self.add_status_code != 200 or self.skip_add:
            raise SkipTest('Required status code != 200' if self.add_status_code != 200 else 'Skip add is enabled')
        response = self.client.get(self.get_add_url())
        self.assertEqual(response.status_code, self.add_status_code)

    def test_add(self):
        if self.add_status_code != 200 or self.skip_add:
            raise SkipTest('Required status code != 200' if self.add_status_code != 200 else 'Skip add is enabled')
        response = self.client.get(self.get_add_url())
        instance_data = self.create_instance_data()
        data = self.create_form_instance_data(response, instance_data)
        data['_continue'] = ''
        data.update(self.get_form_data_update())
        response = self.client.post(self.get_add_url(), data, follow=True)
        self.assertEqual(response.status_code, self.add_status_code)
        if 'original' not in response.context_data:
            self.fail('Instance is not created.')

    def test_change_view(self):
        if self.skip_change:
            raise SkipTest('Skip change is enabled')
        response = self.client.get(self.get_change_url())
        self.assertEqual(response.status_code, self.change_status_code)

    def test_change(self):
        if self.change_status_code != 200 or self.skip_change:
            raise SkipTest('Required status code != 200' if self.change_status_code != 200
                           else 'Skip change is enabled')
        instance = self.create()
        response = self.client.get(self.get_change_url(instance))
        new_data = self.create_form_instance_data(response)
        response = self.client.post(self.get_change_url(instance), new_data, follow=True)
        self.assertEqual(response.status_code, self.change_status_code)

    def test_delete_view(self):
        if self.skip_delete:
            raise SkipTest('Skip delete is enabled')
        response = self.client.get(self.get_delete_url())
        self.assertEqual(response.status_code, self.delete_status_code)

class AdminTestCase(AdminTestMixIn, TestCase):
    pass

class ModelAdminTestCase(ModelAdminTestMixIn, TestCase):
    pass

def test_base_class(cls):
    class NewCls(cls):
        def __init__(self, *args, **kwargs):
            super(NewCls, self).__init__(*args, **kwargs)
            self.users = []
            self.helper = None
            if self.__class__ != NewCls:
                self.run = NewCls.run.__get__(self, self.__class__)
            else:
                self.run = lambda self, *args, **kwargs: None
    return NewCls

AdminTestCase = test_base_class(AdminTestCase)
ModelAdminTestCase = test_base_class(ModelAdminTestCase)

def uuid_to_base10(self, uuid_val):
    if not isinstance(uuid_val, uuid.UUID):
        uuid_val = uuid.UUID(str(uuid_val))
    return str(uuid_val.int)