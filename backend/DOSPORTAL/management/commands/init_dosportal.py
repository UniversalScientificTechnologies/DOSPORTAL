from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Initialize DOSPORTAL: run migrations, load fixtures if empty, setup MinIO'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force-fixtures',
            action='store_true',
            help='Force loading fixtures even if database is not empty',
        )
        parser.add_argument(
            '--skip-fixtures',
            action='store_true',
            help='Skip loading fixtures (only run migrations)',
        )
        parser.add_argument(
            '--skip-minio',
            action='store_true',
            help='Skip MinIO bucket setup',
        )

    def handle(self, *args, **options):
        # 1. Migrations
        self.stdout.write('==> Running migrations...')
        call_command('migrate', '--noinput')
        self.stdout.write(self.style.SUCCESS('==> Migrations completed'))

        # 2. Fixtures
        if options['skip_fixtures']:
            self.stdout.write('==> Skipping fixtures (--skip-fixtures)')
        else:
            self._load_fixtures(options)

        # 3. MinIO setup
        if options['skip_minio']:
            self.stdout.write('==> Skipping MinIO setup (--skip-minio)')
        else:
            self._setup_minio()

        self.stdout.write(self.style.SUCCESS('==> DOSPORTAL initialization completed'))

    def _load_fixtures(self, options):
        from DOSPORTAL.models import DetectorType
        
        detector_type_count = DetectorType.objects.count()

        if detector_type_count == 0 or options['force_fixtures']:
            if detector_type_count == 0:
                self.stdout.write('==> Database is empty (no detector types), loading fixtures...')
            else:
                self.stdout.write('==> Force loading fixtures...')

            try:
                call_command('loaddata', 'initial_data.json')
                self.stdout.write(self.style.SUCCESS('==> Fixtures loaded successfully'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'==> Failed to load fixtures: {e}'))
                raise
        else:
            self.stdout.write(f'==> Database already has {detector_type_count} detector type(s), skipping fixtures')

    def _setup_minio(self):
        self.stdout.write('==> Setting up MinIO...')
        try:
            call_command('setup_minio')
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'==> MinIO setup failed: {e}'))
