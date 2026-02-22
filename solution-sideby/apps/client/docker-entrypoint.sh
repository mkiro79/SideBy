#!/bin/sh
set -e

# Replace ${PORT} in nginx config with actual PORT env variable
# Railway defaults to port 3000 if not set
export PORT=${PORT:-3000}

# Use envsubst to replace variables in nginx config template
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Remove the template file
rm /etc/nginx/conf.d/default.conf.template

# Start nginx
exec nginx -g 'daemon off;'
