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
