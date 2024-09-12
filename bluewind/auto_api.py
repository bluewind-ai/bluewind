# auto_api.py
from django.apps import apps
from rest_framework import serializers, viewsets
from rest_framework.routers import DefaultRouter


def generate_auto_api():
    # Create a default router
    router = DefaultRouter()

    # Iterate over all installed apps
    for app_config in apps.get_app_configs():
        # Iterate over all models in each app
        for model in app_config.get_models():
            # Define the Meta class for the serializer
            meta_class = type("Meta", (), {"model": model, "fields": "__all__"})

            # Define the serializer class dynamically
            CustomSerializer = type(
                f"{model.__name__}Serializer",
                (serializers.ModelSerializer,),
                {"Meta": meta_class},
            )

            # If the model requires specific fields, customize the serializer further
            if model.__name__ == "FlowRun":
                CustomSerializer._declared_fields["flow"] = (
                    serializers.SlugRelatedField(
                        slug_field="name",
                        queryset=model._meta.get_field(
                            "flow"
                        ).related_model.objects.all(),
                    )
                )

            # Define the viewset class using the serializer class
            class CustomViewSet(viewsets.ModelViewSet):
                queryset = model.objects.all()
                serializer_class = CustomSerializer

                # Customize the lookup field for specific models
                if model.__name__ == "FlowRun":
                    lookup_field = "flow__name"

            # Register the viewset with the router using a dynamic URL path
            router.register(
                f"workspaces/(?P<workspace_id>[^/.]+)/{model._meta.model_name}",
                CustomViewSet,
                basename=f"{model._meta.model_name}",
            )

    # Return all the dynamically generated URLs
    return router.urls
