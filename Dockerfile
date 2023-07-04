FROM debian:latest

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN apt update
RUN apt install -y python3 net-tools python3-pip libpq-dev 

WORKDIR /DOSPORTAL
COPY requirements.txt /DOSPORTAL/
RUN pip3 install -r requirements.txt --break-system-packages
COPY . /DOSPORTAL/

ENTRYPOINT python3 manage.py runserver 0.0.0.0:8000
