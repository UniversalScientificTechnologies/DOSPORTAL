from django.views import generic
from .models import (DetectorCalib,
                     Detector, DetectorType, DetectorLogbook)
from .forms import DetectorLogblogForm, DetectorEditForm, DetectorCalibForm, DetectorCalibFormSet

from django.shortcuts import get_object_or_404, redirect, render




FIRST_CHANNEL = 10


def DetectorView(request, pk):
    detector = Detector.objects.get(pk=pk)
    form = DetectorCalibForm(instance=detector)
    formset = DetectorCalibFormSet(instance=detector)
    
    #return HttpResponse(a)
    return render(request, 'detectors/detectors_detail.html', context={'detector': detector, 'DetectorLogblogForm': DetectorLogblogForm, 'calibForm': form, 'calibFormset': formset})


def DetectorEditView(request, pk=None):
    detectorEditForm = DetectorEditForm( instance=Detector.objects.get(pk=pk) if pk else None)

    if request.method == 'POST':
        detectorEditForm = DetectorEditForm(request.POST)
        if detectorEditForm.is_valid():
            detectorEditForm.save()
            return redirect('detector-view', pk=detectorEditForm.instance.pk)

    return render(request, 'detectors/detector_edit.html', context={'detectorEditForm': detectorEditForm})


class  DetectorOverview(generic.ListView):
    #detectors = DetectorsTable()
    model = Detector
    context_object_name = "detector_list"
    sequence = ("id", "sn", "name", )
    queryset = Detector.objects.all()
    template_name = 'detectors/detectors_overview.html'

    def POST(self, request, *args, **kwargs):
        print("POST")
        print(request)
        form = DetectorLogblogForm(request.POST) 
        if form.is_valid():

            _text = form.cleaned_data['text']
            # FIXME: 'detector' is undefined here. Please provide the correct detector instance.
            # DetectorLogbook.objects.create(detector=detector, author=request.user, text=text)

            return redirect('detector-view')


        return render(request, self.template_name, {'form': form, 'detector_list': self.get_queryset()})

def DetectorNewLogbookRecord(request, pk):
    detector = Detector.objects.get(pk=pk)

    form = DetectorLogblogForm(request.POST)
    if form.is_valid():

        text = form.cleaned_data['text']
        DetectorLogbook.objects.create(detector=detector, author=request.user, text=text)

        return redirect('detector-view', pk=pk)
    #return HttpResponse(a)



def DetectorTypeView(request, pk):
    detectorType = DetectorType.objects.get(pk=pk)
    return render(request, 'detectors/detector_type_detail.html', context={'detector': detectorType})


class DetectorCalibDetailView(generic.DetailView):
    model = DetectorCalib
    template_name = 'detectors/detectorCalib_detail.html'


    def POST(self, request, pk, *args, **kwargs):
        return render(request, self.template_name, {'calib': get_object_or_404(self.model, pk=pk)})
