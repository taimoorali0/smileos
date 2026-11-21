# SmileOS – one image serving the API and the web app
FROM node:20-alpine AS web
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
COPY brand/ /app/brand/
RUN npm run build

FROM node:20-alpine
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=web /app/web/dist /app/web/dist
ENV PORT=4000 UPLOAD_DIR=/data/uploads
EXPOSE 4000
CMD ["sh", "-c", "node src/migrate.js && node src/index.js"]
