# Generated by Django 4.2.11 on 2024-04-12 14:55

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('DOSPORTAL', '0034_alter_detector_data_alter_record_metadata'),
    ]

    operations = [
        migrations.AddField(
            model_name='record',
            name='time_internal_start',
            field=models.FloatField(blank=True, default=0, help_text='System time of record start', null=True, verbose_name='Internal time start'),
        ),
    ]
