from rest_framework.viewsets import ModelViewSet


class SoftDeleteModelViewSet(ModelViewSet):
    """
    Base ViewSet that routes DELETE to soft_delete() instead of hard delete.
    Automatically records deleted_by from the request user.
    """

    def perform_destroy(self, instance):
        instance.soft_delete(deleted_by=self.request.user)
