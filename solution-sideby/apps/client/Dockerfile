# Development Stage
FROM node:20 AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Start Vite dev server with host binding for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Production Build Stage
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build arguments for Vite env variables (Railway passes these automatically)
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_APP_NAME
ARG VITE_APP_VERSION
ARG VITE_ENV
ARG VITE_SENTRY_DSN
ARG VITE_FEATURE_EMAIL_LOGIN
ARG VITE_FEATURE_AI_ENABLED
ARG VITE_FEATURE_DATASET_EDIT_ENABLED
ARG VITE_EMAILJS_SERVICE_ID
ARG VITE_EMAILJS_TEMPLATE_ID
ARG VITE_EMAILJS_PUBLIC_KEY

# Set as environment variables for the build process
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_ENV=$VITE_ENV
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_FEATURE_EMAIL_LOGIN=$VITE_FEATURE_EMAIL_LOGIN
ENV VITE_FEATURE_AI_ENABLED=$VITE_FEATURE_AI_ENABLED
ENV VITE_FEATURE_DATASET_EDIT_ENABLED=$VITE_FEATURE_DATASET_EDIT_ENABLED
ENV VITE_EMAILJS_SERVICE_ID=$VITE_EMAILJS_SERVICE_ID
ENV VITE_EMAILJS_TEMPLATE_ID=$VITE_EMAILJS_TEMPLATE_ID
ENV VITE_EMAILJS_PUBLIC_KEY=$VITE_EMAILJS_PUBLIC_KEY

# Build for production
RUN npm run build

# Production Stage
FROM nginx:alpine AS production

# Install envsubst (part of gettext package)
RUN apk add --no-cache gettext

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config template
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose default Railway port
EXPOSE 3000

# Use custom entrypoint to handle PORT env variable
ENTRYPOINT ["/docker-entrypoint.sh"]
