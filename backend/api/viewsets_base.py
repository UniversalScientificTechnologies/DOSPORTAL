from rest_framework.viewsets import ModelViewSet


class SoftDeleteModelViewSet(ModelViewSet):
    """
    Routes DELETE to soft_delete() instead of hard delete.
    """

    def perform_destroy(self, instance):
        instance.soft_delete(deleted_by=self.request.user)
