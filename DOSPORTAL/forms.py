from django import forms
from .models import Detector, record


class DetectorLogblogForm(forms.Form):
    text = forms.CharField(
        widget=forms.Textarea(
            attrs={
                'class': 'form-control'
            }
        )
    )



class RecordForm(forms.ModelForm):
    log_file = forms.FileField(
        required=False,
        widget=forms.widgets.FileInput(attrs={
            'class': 'form-control',
        }),
        label="Log file",
        help_text="Select a log file to upload."
        #widget=forms.FileInput(attrs={
        #    'class': 'form-control',
        #})
    )

    detector = forms.ModelChoiceField(
        queryset=Detector.objects.all(),
        widget=forms.Select(attrs={
            'class': 'form-control',
        }),
        required=False,
        label="Detector",
        help_text="Select used detector. It is not mandatory in case of detectors with auto-detect feature."
    )

    record_type = forms.ChoiceField(
        choices=record.RECORD_TYPES,
        widget=forms.Select(attrs={
            'class': 'form-control',
        })
    )


    class Meta:
        model = record
        exclude = ("time_end", "measurement", "log_filename", "metadata", "duration", "time_start", "record_duration")
