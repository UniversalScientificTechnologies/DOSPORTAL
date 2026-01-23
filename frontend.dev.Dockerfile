# Django frontend

FROM node:current-alpine3.23

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ ./

RUN chmod +x entrypoint.sh

EXPOSE 5173

RUN ls -la
RUN echo "here"

ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]
