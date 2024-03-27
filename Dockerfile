FROM debian:latest

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt-get update
RUN apt-get install -y python3 net-tools python3-pip libpq-dev redis binutils libproj-dev gdal-bin

WORKDIR /DOSPORTAL
COPY requirements.txt /DOSPORTAL/
RUN pip3 install -r requirements.txt --break-system-packages
#COPY . /DOSPORTAL/
#COPY cari7a /usr/local/bin/cari7a

ENTRYPOINT python3 manage.py runserver 0.0.0.0:8000
