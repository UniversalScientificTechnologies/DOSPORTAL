from django import forms
from django.http import HttpResponse, JsonResponse
from .models import (Measurement, Detector, File)

from django.shortcuts import get_object_or_404, redirect, render

from .forms import RecordForm



import pandas as pd
import numpy as np
from datetime import datetime, timedelta




FIRST_CHANNEL = 10


def index(request):
    return HttpResponse("Hello, world. You're at the polls index.")



class NewMeasurementForm(forms.ModelForm):

    name = forms.CharField(
        required=True,
        label = "Measurement name"
    )

    description = forms.CharField(
        required=False,
        label="Measurement description"   
    )

    public = forms.BooleanField(
        required=False,
        initial=True,
        label = "Will be this log public?"
    )

    class Meta:
        model = Measurement
        exclude = ("time_end", "measurement", 'author', 'time_start', 'base_location_lat', 'base_location_lon', 'base_location_alt')


def handle_uploaded_file(f, file):
    with open(file, "wb+") as destination:
        for chunk in f.chunks():
            destination.write(chunk)


def obtain_parameters_from_log(file):

    f = open(file)
    line_1 = f.readline().rstrip().split(',')
    record_metadata = {}
    record_metadata['detector'] = dict(zip(['DET', 'detector_type', 'firmware_build', 'channels', 'firmware_commit', 'firmware_origin', 'detector_sn'], line_1))

    time_start = 0
    while True:
        line = f.readline()
        if line.startswith('$HIST'):
            line = line.rstrip().split(',')
            time_start = float(line[2])
            break
    i = -1
    flen = len(f.readlines())
    while True:
        f.seek(flen+i)
        line = f.readline()
        if line.startswith('$HIST'):
            line = line.rstrip().split(',')
            time_stop = float(line[2])
            count = int(line[1])
            break
        i -= 1
    
    record_metadata['record'] = {}
    record_metadata['record'] = {
        'duration': time_stop - time_start,
        'count': count
    }


    f.close()
    return record_metadata


def MeasurementRecordNewView(request, pk):
    if request.method == "POST":
        print("POST... s formulářem :) ")
        form = RecordForm(request.POST, request.FILES)
        #print(form)

        if form.is_valid():
            data = form.save(commit=False)
            data.author = request.user
            data.log_file = request.FILES['log_file']
            
            #data.log_filename = request.FILES['log_file'].name.split("/")[-1]
            handle_uploaded_file(request.FILES['log_file'], data.log_file.name)
            metadata = obtain_parameters_from_log(data.log_file.path)
            print("Medatada z logu")
            print(metadata)
            if metadata:
                detector_pk = Detector.objects.get(sn=metadata['detector']['detector_sn'])
                if detector_pk:
                    data.detector = detector_pk
                data.metadata = metadata
                data.record_duration = timedelta(seconds = metadata['record']['duration'])
            data.measurement = Measurement.objects.get(pk=pk)

            print(data)
            data.save()
            
        else:
            print("Form není validni")
            print(form.errors)
        
        return redirect("measurement-detail", pk=pk)




def MeasurementDetailView(request, pk):
    #model = measurement
    ms = get_object_or_404(Measurement, pk=pk)
    record_form = RecordForm()
    return render(request, 'measurements/measurement_detail.html', context={'measurement': ms, 'record_form': record_form})


def MeasurementNewView(request):

    if request.method == "POST":
        print("POST... s formulářem :) ")
        form = NewMeasurementForm(request.POST)
        print(form)
        if form.is_valid():
            data = form.save(commit=False)
            data.author = request.user
            data.save()
            return redirect("measurements")


    return render(request, 'measurements/measurement_new.html',
                  context={'form': NewMeasurementForm() })



def MeasurementDataView(request, pk):
    if request.method == "GET":
        print(pk)
        print("MAM GET... ")

        a=Measurement.objects.get(pk=pk)
        File.objects.filter(measurement=pk, record_type="S")
        File.objects.filter(measurement=pk, record_type="L")


        #return HttpResponse(a)
        return render(request, 'measurements/measurement_view_data.html', context={'record': a })
    



def measuredDataGet(request, pk):
    from io import StringIO

    response = HttpResponse(
        content_type="text/csv",
        #headers={"Content-Disposition": 'attachment; filename="data.csv"'},
    )

    Measurement.objects.get(pk=pk)
    rec=File.objects.filter(measurement=pk, record_type="S")
    File.objects.filter(measurement=pk, record_type="L")


    b = rec[0]

    #for i, b in enumerate(rec):

    print(b.log_file, b.log_filename)
    f = open(b.log_file.path )
    f.readline()
    f.close()

    histogram = []

    with open(b.log_file.path) as f:
        r = f.readline()
        if r.startswith("$HIST"):
            histogram.append(r)
        elif r.startswith("$DOS"):
            mdata = r.split(',')
            dict(zip(['DET', 'detector_type', 'firmware_build', 'channels', 'firmware_commit', 'firmware_origin', 'detector_sn'], mdata))

    
    df = pd.read_csv(StringIO('\n'.join(histogram)), delimiter=',', low_memory=False)
    print(df)


    # Parse log file header to obtain basic informations

    # s = {
    #     'name': "Evolution_"+str(i)+"_avg",
    #     'type': 'line',
    #     'data': [],
    #     'showSymbol': False,
    #     #'xAxisIndex': 1,
    #     'yAxisIndex': 1,
    # }


    # s2 = {
    #     'name': "Evolution_"+str(i),
    #     'type': 'scatter',
    #     'data': [],
    #     'symbolSize': 3,
    #     'itemStyle': {
    #         'opacity': 0.4
    #     },
    # }

    #df = pd.read_csv(b.log_file, sep=',', header=None, comment='*', low_memory=False, skiprows=1)
    #df = df.reset_index(drop=True)


    column_names = []
    column_names.extend(range(0, 2000))
    df = pd.read_csv(b.log_file.path, sep=' ', header=None, names=column_names, comment='#', low_memory=False)  # ,engine='python' )
    #df = pd.read_csv(b.log_file.path, header=None, comment='*', low_memory=False, skiprows=1)
    #df = df[df[0].str.startswith("$HIST")]
    #df = df[0].str.split(",", expand=True)




    response.write(df.to_csv(index=False))
    return response


    #     print("DF")

    #     LAST_CHANNEL = len(df.columns)
    #     #df.set_columns = list(range(0,LAST_CHANNEL))

    #     df[2] = df[2].apply(pd.to_numeric, errors='coerce')

    #     df['runtime'] = np.nan
    #     df.loc[df[0]=='$HIST','seconds'] = df.loc[df[0]=='$HIST',2]
    #     df.loc[df[0]=='$DOS','seconds'] = 0
    #     df['runtime'] = df['seconds'].diff() * -1
    #     df = df.copy()

    #     run = 0
    #     df['run'] = np.nan
    #     df['run'].fillna(method="ffill", inplace=True)

    #     df[2] = pd.to_numeric(df[2])
    #     df['time'] = b.time_start + pd.to_timedelta(df[2], unit='s')
    #     df.set_index(df['time'], drop=False, inplace=True)


    #     #cmap = matplotlib.cm.get_cmap('tab10')
    #     #color = cmap(i/len(rec))
        
    #     #df = data[x]['df']
    #     df['sum'] = df[range(FIRST_CHANNEL,LAST_CHANNEL)].sum(axis=1)/10/2
    #     #df['sum'] = df[range(FIRST_CHANNEL,LAST_CHANNEL)].sum(axis=1)

    #     df['sum_f'] = df['sum'].rolling(15).mean()

    #     sd = df['sum_f'].copy().dropna()
    #     s['data'] = list(zip(sd.index, sd))

    #     sd2 = df['sum'].copy().dropna()
    #     s2['data'] = list(zip(sd2.index, sd2))

    #     print(s['data'])

    #     series.append(s)
    #     series.append(s2)

    # for i, l in enumerate(loc):
    #     if 'gpx' in l.log_filename:
    #         print("Nacitam GPX..")
    #         print(l.log_file)
    #         gpx_file = open(str(l.log_file), 'r')
    #         gpx = gpxpy.parse(gpx_file)

    #         #df = pd.DataFrame(columns=['lon', 'lat', 'alt', 'time'])
    #         df = pd.DataFrame(columns=['lon', 'lat', 'alt', 'time'])
    #         for segment in gpx.tracks[0].segments:
    #             data = segment.points
    #             for point in data:
    #                 df.loc[len(df)] = pd.Series({'lon': point.longitude, 'lat' : point.latitude, 'alt' : point.elevation, 'time' : point.time})

    #         df = df.sort_values(by='time')
    #         df.set_index(df['time'], drop=False, inplace=True)
    #         #df = df.reset_index()

    #         df = df.fillna(method='ffill')
    #         df = df.fillna(method='bfill')

    #         s = {
    #             'name': "Altitude_"+str(i),
    #             'type': 'line',
    #             'data': list(zip(df.index, df['alt']*0.001)),
    #             'symbolSize': 3,
    #             'itemStyle': {
    #                 'opacity': 0.4
    #             },
    #             'yAxisIndex': 1,
    #         }

    #         series.append(s)
            

    #     elif '.csv' in l.log_filename:
    #         df = pd.read_csv(l.log_file)
    #         df['UTC'] = pd.to_datetime(df['UTC'])
    #         df = df.sort_values(by='UTC')
    #         df.set_index(df['UTC'], drop=True, inplace=True)

    #         print(df)

    #         s = {
    #             'name': "Altitude_"+str(i),
    #             'type': 'line',
    #             'data': list(zip(df.index, df['Altitude']*0.0003048)),
    #             'symbolSize': 3,
    #             'itemStyle': {
    #                 'opacity': 0.4
    #             },
    #             'yAxisIndex': 1,
    #         }

    #         series.append(s)


    #     return JsonResponse(series, safe=False)


def measuredSpectraGet(request, pk):

    Measurement.objects.get(pk=pk)

    part_from = int(float(request.GET.get('start', 0)))  
    part_to = int(float(request.GET.get('end', 0)))    

    rec=File.objects.filter(measurement=pk, record_type="S")
    #loc=File.objects.filter(measurement=pk, record_type="L")

    #l=[]
    #l.extend(range(0,2000))

    spc = []

    for i, b in enumerate(rec):

        df = pd.read_csv(b.log_file, sep=',', header=None, comment='*', low_memory=False, skiprows=2)
        df = df.reset_index(drop=True)

        LAST_CHANNEL = len(df.columns)


        df[2] = df[2].apply(pd.to_numeric, errors='coerce')

        df['runtime'] = np.nan
        df.loc[df[0]=='$HIST','seconds'] = df.loc[df[0]=='$HIST',2]
        df.loc[df[0]=='$DOS','seconds'] = 0
        df['runtime'] = df['seconds'].diff() * -1

        df['run'] = np.nan
        df['run'].fillna(method="ffill", inplace=True)

        df[2] = pd.to_numeric(df[2])
        df['time'] = b.time_start + pd.to_timedelta(df[2], unit='s')


        if part_from>10 and part_to>10:
            print("BUDE OREZ DAT...")
            print(part_from, part_to)

            start_date =  pd.to_datetime(datetime.utcfromtimestamp(part_from), utc=True)
            end_date =  pd.to_datetime(datetime.utcfromtimestamp(part_to), utc=True)
            
            print(start_date, end_date)
            
            df = df.loc[ ((df['time']) >= start_date)
                    & ((df['time']) < end_date) ]

        df.set_index(df['time'], drop=False, inplace=True)


        ener = df.iloc[:,FIRST_CHANNEL:LAST_CHANNEL].sum().reset_index()[0]
        spc.append(ener.to_dict())
        #print(ener)

        # coef3 = np.array([0.,0.])
        # coef3[1] = 0.016
        # coef3[0] = 0.034

        # print (coef3[0], coef3[1])

        # e3 = pd.DataFrame()
        # e3['1'] = ener
        # e3['i'] = ener.index
        # e3['x'] = (e3['i'].astype(float)-FIRST_CHANNEL) * coef3[1] + coef3[0]

    return JsonResponse(spc, safe=False)



def measurementGetData(request, pk):

    Measurement.objects.get(pk=pk)
    File.objects.filter(measurement=pk, record_type="S")
    File.objects.filter(measurement=pk, record_type="L")

