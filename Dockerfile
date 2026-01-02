FROM debian:latest

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update
RUN apt-get install -y python3 python3-pip python3-setuptools libpq-dev binutils libproj-dev gdal-bin
#RUN apt-get install -y net-tools

WORKDIR /DOSPORTAL
COPY requirements.txt /DOSPORTAL/
RUN pip3 install -r requirements.txt --break-system-packages
#COPY . /DOSPORTAL/
#COPY cari7a /usr/local/bin/cari7a

ENTRYPOINT python3 manage.py runserver 0.0.0.0:8000
