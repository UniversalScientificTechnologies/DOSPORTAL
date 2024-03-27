from django.db.models.signals import post_save 
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import Profile, record


@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_profile(sender, instance, **kwargs):
    instance.profile.save()



@receiver(post_save, sender=record)
def save_record(sender, instance, **kwargs):
    print("AFTER SAVE.... ")
    print(sender)
    print(instance)
    print(kwargs)

    filepath = 'data/media/'+instance.log_file
    print(filepath)

    metadata = instance.metadata

    if 'device_info' not in metadata:
        metadata['device_info'] = {}

    with open(filepath, 'r') as file:
        for line in file:
            print(line)

