from django.views import generic
from .models import DetectorCalib

from django.shortcuts import get_object_or_404, render


class DetectorCalibDetailView(generic.DetailView):
    model = DetectorCalib
    template_name = 'detectors/detectorCalib_detail.html'


    def POST(self, request, pk, *args, **kwargs):
        return render(request, self.template_name, {'calib': get_object_or_404(self.model, pk=pk)})
