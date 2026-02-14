from django.db.models.signals import post_save 
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import Profile, File
from .models.spectrals import SpectralRecord
from django.conf import settings
from rest_framework.authtoken.models import Token

from django_q.tasks import async_task


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_auth_token(sender, instance=None, created=False, **kwargs):
    if created:
        Token.objects.create(user=instance)

@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_profile(sender, instance, **kwargs):
    instance.profile.save()


@receiver(post_save, sender=SpectralRecord)
def process_spectral_record(sender, instance: SpectralRecord, created=False, **kwargs):
    """
    Schedule async processing of SpectralRecord when created.
    """
    
    if kwargs.get('update_fields'): # Avoid recursive calls from save() operations
        return
    
    if created and instance.raw_file and instance.raw_file.file_type == File.FILE_TYPE_LOG:
        print(f"Scheduling async processing for SpectralRecord {instance.id}")
        
        # Post-process spectral record raw file into artefacts
        async_task('DOSPORTAL.tasks.process_spectral_record_into_spectral_file_async', instance.id)

        print(f"Async task scheduled for SpectralRecord {instance.id}")
