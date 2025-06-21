#!/bin/sh
set -e

echo "🐺 Werewolf Game - Starting nginx proxy server..."

# Map REACT_APP_ environment variables for backward compatibility
export GEMINI_API_KEY=${GEMINI_API_KEY:-${REACT_APP_GEMINI_API_KEY:-""}}
export GEMINI_MODEL=${GEMINI_MODEL:-${REACT_APP_GEMINI_MODEL:-"gemini-2.5-flash"}}
export OPENAI_API_KEY=${OPENAI_API_KEY:-${REACT_APP_OPENAI_API_KEY:-""}}
export OPENAI_MODEL=${OPENAI_MODEL:-${REACT_APP_OPENAI_MODEL:-"gpt-4o-mini"}}
export OPENAI_BASE_URL=${OPENAI_BASE_URL:-${REACT_APP_OPENAI_BASE_URL:-"https://api.openai.com/v1"}}
export OPENAI_HOST=${OPENAI_HOST:-$(echo ${OPENAI_BASE_URL} | sed "s|https\?://||" | sed "s|/.*||")}
export OLLAMA_BASE_URL=${OLLAMA_BASE_URL:-${REACT_APP_OLLAMA_BASE_URL:-"http://localhost:11434"}}
export OLLAMA_MODEL=${OLLAMA_MODEL:-${REACT_APP_OLLAMA_MODEL:-"gemma3:4b"}}

# Debug: Show environment variables (remove in production if needed)
echo "📋 API Provider Configuration:"
if [ -n "$OPENAI_API_KEY" ]; then
    echo "  OPENAI_API_KEY: ${OPENAI_API_KEY:0:10}...***"
    echo "  OPENAI_BASE_URL: $OPENAI_BASE_URL"
    echo "  OPENAI_HOST: $OPENAI_HOST"
    echo "  OPENAI_MODEL: $OPENAI_MODEL"
fi

if [ -n "$GEMINI_API_KEY" ]; then
    echo "  GEMINI_API_KEY: ${GEMINI_API_KEY:0:10}...***"
    echo "  GEMINI_MODEL: $GEMINI_MODEL"
fi

if [ -n "$OLLAMA_BASE_URL" ]; then
    echo "  OLLAMA_BASE_URL: $OLLAMA_BASE_URL"
    echo "  OLLAMA_MODEL: $OLLAMA_MODEL"
fi

# Generate nginx config from template
echo "🔧 Generating nginx configuration from template..."
envsubst '$GEMINI_API_KEY $GEMINI_MODEL $OPENAI_API_KEY $OPENAI_MODEL $OPENAI_BASE_URL $OPENAI_HOST $OLLAMA_BASE_URL $OLLAMA_MODEL' \
    < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Validate nginx configuration
echo "✅ Validating nginx configuration..."
nginx -t

# Start nginx
echo "🚀 Starting nginx server..."
exec nginx -g "daemon off;" 