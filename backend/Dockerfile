# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim

ENV NODE_ENV=production
ENV PORT=5000

WORKDIR /app

# Cache dependencies independently from application source changes.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

# Use the unprivileged user supplied by the official Node.js image.
USER node

EXPOSE 5000

CMD ["node", "src/server.js"]
