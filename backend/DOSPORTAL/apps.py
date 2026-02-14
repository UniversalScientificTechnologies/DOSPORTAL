from django.apps import AppConfig


class DosportalConfig(AppConfig):
    name = 'DOSPORTAL'

    def ready(self):
        import DOSPORTAL.signals  # noqa