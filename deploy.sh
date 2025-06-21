#!/bin/bash

# Werewolf Game Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐺 Werewolf Game Deployment Script${NC}"
echo "=================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    echo "Creating .env file from template..."
    cp env.example .env
    echo -e "${RED}❌ Please edit .env file with your API keys before running this script again.${NC}"
    echo "Example: nano .env"
    exit 1
fi

# Source environment variables
source .env

# Validate required environment variables based on AI provider
echo -e "${BLUE}🔍 Validating configuration...${NC}"

# Check if REACT_APP_AI_PROVIDER is set
if [ -z "$REACT_APP_AI_PROVIDER" ]; then
    echo -e "${RED}❌ REACT_APP_AI_PROVIDER is not set${NC}"
    echo "Please set your AI provider in .env file (gemini, openai, or ollama)"
    exit 1
fi

case "${REACT_APP_AI_PROVIDER}" in
    "gemini")
        if [ -z "$REACT_APP_GEMINI_API_KEY" ] || [ "$REACT_APP_GEMINI_API_KEY" = "your_gemini_api_key_here" ]; then
            echo -e "${RED}❌ REACT_APP_GEMINI_API_KEY is not set or using placeholder value${NC}"
            echo "Please set your Gemini API key in .env file"
            exit 1
        fi
        if [ -z "$REACT_APP_GEMINI_MODEL" ]; then
            echo -e "${RED}❌ REACT_APP_GEMINI_MODEL is not set${NC}"
            echo "Please set your Gemini model in .env file"
            exit 1
        fi
        echo -e "${GREEN}✅ Gemini configuration validated${NC}"
        ;;
    "openai")
        if [ -z "$REACT_APP_OPENAI_API_KEY" ] || [ "$REACT_APP_OPENAI_API_KEY" = "sk-your-openai-key-here" ]; then
            echo -e "${RED}❌ REACT_APP_OPENAI_API_KEY is not set or using placeholder value${NC}"
            echo "Please set your OpenAI API key in .env file"
            exit 1
        fi
        if [ -z "$REACT_APP_OPENAI_MODEL" ]; then
            echo -e "${RED}❌ REACT_APP_OPENAI_MODEL is not set${NC}"
            echo "Please set your OpenAI model in .env file"
            exit 1
        fi
        if [ -z "$REACT_APP_OPENAI_BASE_URL" ]; then
            echo -e "${RED}❌ REACT_APP_OPENAI_BASE_URL is not set${NC}"
            echo "Please set your OpenAI base URL in .env file"
            exit 1
        fi
        echo -e "${GREEN}✅ OpenAI configuration validated${NC}"
        ;;
    "ollama")
        if [ -z "$REACT_APP_OLLAMA_BASE_URL" ]; then
            echo -e "${RED}❌ REACT_APP_OLLAMA_BASE_URL is not set${NC}"
            echo "Please set your Ollama base URL in .env file"
            exit 1
        fi
        if [ -z "$REACT_APP_OLLAMA_MODEL" ]; then
            echo -e "${RED}❌ REACT_APP_OLLAMA_MODEL is not set${NC}"
            echo "Please set your Ollama model in .env file"
            exit 1
        fi
        echo -e "${GREEN}✅ Ollama configuration validated${NC}"
        ;;
    *)
        echo -e "${RED}❌ Unknown AI provider: $REACT_APP_AI_PROVIDER${NC}"
        echo "Supported providers: gemini, openai, ollama"
        exit 1
        ;;
esac

# Function to build and run with Docker
build_and_run() {
    echo -e "${BLUE}🔨 Building Docker image with environment variables...${NC}"
    
    # Build arguments for React environment variables
    BUILD_ARGS=""
    BUILD_ARGS="$BUILD_ARGS --build-arg REACT_APP_AI_PROVIDER=${REACT_APP_AI_PROVIDER:-gemini}"
    BUILD_ARGS="$BUILD_ARGS --build-arg REACT_APP_GEMINI_API_KEY=${REACT_APP_GEMINI_API_KEY:-dummy}"
    BUILD_ARGS="$BUILD_ARGS --build-arg REACT_APP_GEMINI_MODEL=${REACT_APP_GEMINI_MODEL:-gemini-2.5-flash}"
    BUILD_ARGS="$BUILD_ARGS --build-arg REACT_APP_OPENAI_API_KEY=${REACT_APP_OPENAI_API_KEY:-dummy}"
    BUILD_ARGS="$BUILD_ARGS --build-arg REACT_APP_OPENAI_MODEL=${REACT_APP_OPENAI_MODEL:-gpt-4o-mini}"
    BUILD_ARGS="$BUILD_ARGS --build-arg REACT_APP_OPENAI_BASE_URL=${REACT_APP_OPENAI_BASE_URL:-https://api.openai.com/v1}"
    BUILD_ARGS="$BUILD_ARGS --build-arg REACT_APP_OLLAMA_BASE_URL=${REACT_APP_OLLAMA_BASE_URL:-http://localhost:11434}"
    BUILD_ARGS="$BUILD_ARGS --build-arg REACT_APP_OLLAMA_MODEL=${REACT_APP_OLLAMA_MODEL:-gemma3:4b}"
    
    echo "Build arguments: $BUILD_ARGS"
    docker build -t werewolf-game $BUILD_ARGS .
    
    echo -e "${BLUE}🚀 Starting application...${NC}"
    docker run -d \
        --name werewolf-game \
        --env-file .env \
        -p 3000:80 \
        werewolf-game
    
    echo -e "${GREEN}✅ Application started successfully!${NC}"
    echo -e "${GREEN}🌐 Access your game at: http://localhost:3000${NC}"
    echo -e "${YELLOW}💡 To stop: docker stop werewolf-game${NC}"
    echo -e "${YELLOW}💡 To view logs: docker logs werewolf-game${NC}"
}

# Function to use docker-compose
compose_run() {
    echo -e "${BLUE}🔨 Starting with docker-compose...${NC}"
    docker-compose up -d --build
    
    echo -e "${GREEN}✅ Application started successfully!${NC}"
    echo -e "${GREEN}🌐 Access your game at: http://localhost:3000${NC}"
    echo -e "${YELLOW}💡 To stop: docker-compose down${NC}"
    echo -e "${YELLOW}💡 To view logs: docker-compose logs${NC}"
}

# Check deployment method
if [ "$1" = "--compose" ] || [ "$1" = "-c" ]; then
    compose_run
elif [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "OPTIONS:"
    echo "  --compose, -c    Use docker-compose (includes Ollama service)"
    echo "  --help, -h       Show this help message"
    echo ""
    echo "Default: Use Docker directly"
else
    # Clean up existing container if it exists
    if [ "$(docker ps -q -f name=werewolf-game)" ]; then
        echo -e "${YELLOW}🛑 Stopping existing container...${NC}"
        docker stop werewolf-game
    fi
    
    if [ "$(docker ps -aq -f name=werewolf-game)" ]; then
        echo -e "${YELLOW}🗑️  Removing existing container...${NC}"
        docker rm werewolf-game
    fi
    
    build_and_run
fi 