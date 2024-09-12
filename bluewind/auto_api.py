from rest_framework import serializers, viewsets
from rest_framework.routers import DefaultRouter

from django.apps import apps


def create_model_serializer(model):
    attrs = {}

    if model.__name__ == "FlowRun":
        flow_field = model._meta.get_field("flow")
        attrs["flow"] = serializers.SlugRelatedField(
            slug_field="name", queryset=flow_field.related_model.objects.all()
        )

    class Meta:
        pass

    Meta.model = model
    Meta.fields = "__all__"
    attrs["Meta"] = Meta

    serializer_class = type(
        f"{model.__name__}Serializer", (serializers.ModelSerializer,), attrs
    )
    return serializer_class


def create_model_viewset(model, serializer_class):
    attrs = {
        "queryset": model.objects.all(),
        "serializer_class": serializer_class,
    }

    if model.__name__ == "FlowRun":
        attrs["lookup_field"] = "flow__name"

    viewset_class = type(f"{model.__name__}ViewSet", (viewsets.ModelViewSet,), attrs)
    return viewset_class


def auto_generate_apis():
    router = DefaultRouter()

    for app_config in apps.get_app_configs():
        for model in app_config.get_models():
            serializer_class = create_model_serializer(model)
            viewset_class = create_model_viewset(model, serializer_class)
            router.register(
                f"{model._meta.model_name}",
                viewset_class,
                basename=model._meta.model_name,
            )

    return router.urls
