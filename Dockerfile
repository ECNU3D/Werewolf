# Multi-stage build for React app with nginx

# Stage 1: Build the React app
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Set build-time environment variables for React
ARG REACT_APP_AI_PROVIDER
ARG REACT_APP_GEMINI_API_KEY
ARG REACT_APP_GEMINI_MODEL
ARG REACT_APP_OPENAI_API_KEY
ARG REACT_APP_OPENAI_MODEL
ARG REACT_APP_OPENAI_BASE_URL
ARG REACT_APP_OLLAMA_BASE_URL
ARG REACT_APP_OLLAMA_MODEL

ENV REACT_APP_AI_PROVIDER=${REACT_APP_AI_PROVIDER}
ENV REACT_APP_GEMINI_API_KEY=${REACT_APP_GEMINI_API_KEY}
ENV REACT_APP_GEMINI_MODEL=${REACT_APP_GEMINI_MODEL}
ENV REACT_APP_OPENAI_API_KEY=${REACT_APP_OPENAI_API_KEY}
ENV REACT_APP_OPENAI_MODEL=${REACT_APP_OPENAI_MODEL}
ENV REACT_APP_OPENAI_BASE_URL=${REACT_APP_OPENAI_BASE_URL}
ENV REACT_APP_OLLAMA_BASE_URL=${REACT_APP_OLLAMA_BASE_URL}
ENV REACT_APP_OLLAMA_MODEL=${REACT_APP_OLLAMA_MODEL}

# Build the app
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Install envsubst for environment variable substitution
RUN apk add --no-cache gettext

# Copy the built app from the previous stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration template and entrypoint script
COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY docker-entrypoint.sh /docker-entrypoint.sh

# Make entrypoint script executable
RUN chmod +x /docker-entrypoint.sh

# Expose port 80
EXPOSE 80

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"] 