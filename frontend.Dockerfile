# Django frontend

FROM node:20-alpine

WORKDIR /app/frontend

COPY frontend/package*.json ./

RUN npm install

COPY frontend/ ./

COPY frontend/entrypoint.sh /usr/local/bin/frontend-entrypoint.sh
RUN chmod +x /usr/local/bin/frontend-entrypoint.sh

EXPOSE 5173

ENTRYPOINT ["/usr/local/bin/frontend-entrypoint.sh"]
