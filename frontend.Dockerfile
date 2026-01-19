# Django frontend - statický build

FROM node:20-alpine AS builder

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ ./

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
