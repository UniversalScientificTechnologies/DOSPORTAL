# Django backend

FROM python:3.13-alpine

ARG GIT_COMMIT=unknown
ARG GIT_BRANCH=unknown

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV GIT_COMMIT=$GIT_COMMIT
ENV GIT_BRANCH=$GIT_BRANCH

RUN apk update 
RUN apk add --no-cache \
    postgresql-dev \
    gcc \
    g++ \
    musl-dev \
    linux-headers \
    binutils \
    proj-dev \
    gdal-dev \
    gdal \
    geos \
    geos-dev

WORKDIR /DOSPORTAL
COPY requirements.txt /DOSPORTAL/
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /DOSPORTAL/

RUN python manage.py collectstatic --noinput --clear || true

EXPOSE 8000

ENTRYPOINT ["python", "manage.py", "runserver", "0.0.0.0:8000"]
