from rest_framework import serializers, viewsets
from rest_framework.routers import DefaultRouter

from django.apps import apps


def create_model_serializer(model):
    def serializer_factory():
        class AutoSerializer(serializers.ModelSerializer):
            class Meta:
                model = model
                fields = "__all__"

        return AutoSerializer

    return serializer_factory()


def create_model_viewset(model, serializer_class):
    class AutoViewSet(viewsets.ModelViewSet):
        queryset = model.objects.all()
        serializer_class = serializer_class

    return AutoViewSet


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
