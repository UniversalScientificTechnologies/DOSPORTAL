from django.db.models.signals import post_save 
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models import Profile, Record, SpectrumData
import json
import pandas as pd


@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_profile(sender, instance, **kwargs):
    instance.profile.save()



@receiver(post_save, sender=Record)
def save_record(sender, instance, created = None, **kwargs):
    print("AFTER SAVE.... ")
    print(sender, created)
    print(instance)
    print(kwargs)
    print(".................")
    print(instance.log_file.path, type(instance.log_file))

    if created:

        filepath = instance.log_file.path
        print(filepath)

        metadata = json.loads(instance.metadata) if instance.metadata else {}

        if type(metadata) is not dict:
            metadata = {}

        print("MEDATADA")
        print(type(metadata))
        print(metadata)

        
        metadata['log_device_info'] = {}
        metadata['log_runs_count'] = 0

        max_size = 0

        with open(filepath, 'r') as file:
            for line in file:
                parts_size = len(line.split(","))
                if parts_size > max_size: max_size = parts_size

                if line.startswith("$HIST"):
                    parts = line.split(",")
                    # spec_mod = SpectrumData()
                    # spec_mod.record = instance
                    # spec_mod.spectrum = parts[8:]
                    # spec_mod.integration = 10
                    # spec_mod.time = parts[2]
                    # spec_mod.save()
                    
                elif line.startswith("$DOS"):
                    print("DOS", line)
                    metadata['log_runs_count'] += 1
                    parts = line.split(",")
                    metadata['log_device_info']['DOS'] = {
                        "type": parts[0],
                        "hw-model": parts[1],
                        "fw-version": parts[2],
                        "fw-build_info": parts[5],
                        "fw-commit": parts[4],
                        'hw-sn': parts[5]
                    }
                    
                elif line.startswith("$DIG"):
                    print("DIG", line)
                    parts = line.split(",")
                    metadata['log_device_info']['DIG'] = {
                        "type": parts[0],
                        "hw-model": parts[1],
                        "hw-sn": parts[2],
                        '-': parts[3]
                    }
                    
                elif line.startswith("$ADC"):
                    print("ADC", line)
                    parts = line.split(",")
                    metadata['log_device_info']['ADC'] = {
                        "type": parts[0],
                        "hw-model": parts[1],
                        "hw-sn": parts[2],
                        '-': parts[3]
                    }
        
        df = pd.read_csv(instance.log_file.path, sep = ',', header = None, names=range(max_size))
        print(df)
        df = df [df[0] == '$HIST'] 
        df = df.drop(columns=[0, 1, 3, 4, 5, 6, 7])

        new_columns = ['time'] + list(range(df.shape[1] - 1))
        df.columns = new_columns

        new_name = instance.user_directory_path_data('pk')
        print("BUDU TO UKLADAT DO ",'data/media/'+new_name)
        df.to_pickle('data/media/'+new_name)

        instance.data_file.name = new_name

        print(instance.data_file)


        print("Po ")
        print(df)
                    
        instance.metadata = json.dumps(metadata)
        instance.save()
