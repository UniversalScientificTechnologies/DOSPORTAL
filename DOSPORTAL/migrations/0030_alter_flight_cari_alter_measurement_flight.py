# Generated by Django 4.2.7 on 2023-12-03 10:54

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('DOSPORTAL', '0029_carimodel_flight_cari'),
    ]

    operations = [
        migrations.AlterField(
            model_name='flight',
            name='cari',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='DOSPORTAL.carimodel'),
        ),
        migrations.AlterField(
            model_name='measurement',
            name='flight',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='measurement', to='DOSPORTAL.flight', verbose_name='Reference na objekt s informacemi o letu'),
        ),
    ]
