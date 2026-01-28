# Django frontend - statický build

FROM node:20-alpine AS builder

ARG VITE_API_URL=/api
ARG GIT_COMMIT=unknown
ARG GIT_BRANCH=unknown

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GIT_COMMIT=$GIT_COMMIT
ENV VITE_GIT_BRANCH=$GIT_BRANCH

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ ./

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY nginx_config/frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
