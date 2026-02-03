from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("DOSPORTAL", "0003_delete_testmodel"),
    ]

    operations = [
        migrations.RenameField(
            model_name="detectortype",
            old_name="Detector image",
            new_name="image",
        ),
    ]
