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
        #widget=forms.FileInput(attrs={
        #    'class': 'form-control',
        #})
    )

    detector = forms.ModelChoiceField(
        queryset=Detector.objects.all(),
        widget=forms.Select(attrs={
            'class': 'form-control',
        }),
        required=False
    )

    record_type = forms.ChoiceField(
        choices=record.RECORD_TYPES,
        widget=forms.Select(attrs={
            'class': 'form-control',
        })
    )
    
    time_start = forms.DateTimeField(
        widget=forms.DateTimeInput(attrs={
            'type': "datetime-local",
            'class': 'form-control datetimepicker-input',
        })
    )


    class Meta:
        model = record
        exclude = ("time_end", "measurement", "log_filename", "metadata", "duration")
