# Base image
FROM node:20-alpine AS base
WORKDIR /app

COPY . .
COPY package.json package.json
RUN rm package-lock.json
RUN rm -fr node_modules
RUN npm install
RUN npm run build
