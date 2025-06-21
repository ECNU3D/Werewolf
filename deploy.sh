#!/bin/bash

# Werewolf Game Deployment Script
set -e

# Check for multi-platform build flag
MULTI_PLATFORM=false
REGISTRY_PUSH=false
IMAGE_TAG="werewolf-game"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --multi-platform)
            MULTI_PLATFORM=true
            shift
            ;;
        --push)
            REGISTRY_PUSH=true
            shift
            ;;
        --tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --proxy)
            PROXY_URL="$2"
            shift 2
            ;;
        --compose|-c)
            # Keep existing compose functionality
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "OPTIONS:"
            echo "  --multi-platform     Build for multiple architectures (linux/amd64,linux/arm64)"
            echo "  --push               Push to registry (requires --multi-platform and --tag)"
            echo "  --tag IMAGE_TAG      Specify image tag (default: werewolf-game)"
            echo "  --proxy PROXY_URL    Use proxy for Docker build (e.g., http://127.0.0.1:1087)"
            echo "  --compose, -c        Use docker-compose (includes Ollama service)"
            echo "  --help, -h           Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                                    # Build and run locally"
            echo "  $0 --multi-platform                  # Build multi-platform locally"
            echo "  $0 --multi-platform --push --tag username/werewolf-game:latest"
            echo "                                        # Build and push to registry"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

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

# Function to pull necessary base images
pull_base_images() {
    echo -e "${BLUE}📥 Pulling necessary base images...${NC}"
    
    # Common base images that might be needed
    BASE_IMAGES=(
        "node:18-alpine"
        "nginx:alpine"
        "alpine:latest"
    )
    
    for image in "${BASE_IMAGES[@]}"; do
        echo -e "${BLUE}🔄 Pulling $image...${NC}"
        if docker pull "$image"; then
            echo -e "${GREEN}✅ Successfully pulled $image${NC}"
        else
            echo -e "${YELLOW}⚠️  Failed to pull $image (may not be needed)${NC}"
        fi
    done
    
    echo -e "${GREEN}✅ Base image pulling completed${NC}"
}

# Function to build and run with Docker
build_and_run() {
    # Pull base images first
    pull_base_images
    
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
    
    # Add proxy arguments if proxy is specified
    if [ -n "$PROXY_URL" ]; then
        echo -e "${BLUE}🌐 Using proxy: $PROXY_URL${NC}"
        BUILD_ARGS="$BUILD_ARGS --build-arg HTTP_PROXY=$PROXY_URL"
        BUILD_ARGS="$BUILD_ARGS --build-arg HTTPS_PROXY=$PROXY_URL"
        BUILD_ARGS="$BUILD_ARGS --build-arg NO_PROXY=localhost,127.0.0.1,::1"
    fi
    
    echo "Build arguments: $BUILD_ARGS"
    
    if [ "$MULTI_PLATFORM" = true ]; then
        # Multi-platform build
        if ! docker buildx version >/dev/null 2>&1; then
            echo -e "${RED}❌ Docker buildx is required for multi-platform builds${NC}"
            echo "Please enable Docker BuildKit or update Docker Desktop"
            exit 1
        fi
        
        echo -e "${BLUE}🏗️ Building multi-platform image (linux/amd64,linux/arm64)...${NC}"
        
        # Create and use a new builder instance if it doesn't exist
        if ! docker buildx ls | grep -q "werewolf-builder"; then
            echo "Creating new buildx builder instance..."
            docker buildx create --name werewolf-builder --use
        else
            docker buildx use werewolf-builder
        fi
        
        if [ "$REGISTRY_PUSH" = true ]; then
            # Build and push to registry
            echo -e "${BLUE}📤 Building and pushing to registry: $IMAGE_TAG${NC}"
            docker buildx build \
                --platform linux/amd64,linux/arm64 \
                -t "$IMAGE_TAG" \
                $BUILD_ARGS \
                --push \
                .
            echo -e "${GREEN}✅ Multi-platform image pushed to registry!${NC}"
            echo -e "${YELLOW}💡 To pull on other machines: docker pull $IMAGE_TAG${NC}"
            return 0
        else
            # Build multi-platform but save as local tar (for manual distribution)
            echo -e "${BLUE}💾 Building multi-platform image and saving as tar files...${NC}"
            
            # Build for AMD64 and save
            docker buildx build \
                --platform linux/amd64 \
                -t "${IMAGE_TAG}-amd64" \
                $BUILD_ARGS \
                --output type=docker,dest=werewolf-game-amd64.tar \
                .
            
            # Build for ARM64 and save  
            docker buildx build \
                --platform linux/arm64 \
                -t "${IMAGE_TAG}-arm64" \
                $BUILD_ARGS \
                --output type=docker,dest=werewolf-game-arm64.tar \
                .
            
            # Load the appropriate image for current platform
            CURRENT_ARCH=$(docker version --format '{{.Server.Arch}}')
            if [ "$CURRENT_ARCH" = "amd64" ]; then
                docker load < werewolf-game-amd64.tar
                docker tag "${IMAGE_TAG}-amd64" "$IMAGE_TAG"
            else
                docker load < werewolf-game-arm64.tar  
                docker tag "${IMAGE_TAG}-arm64" "$IMAGE_TAG"
            fi
            
            echo -e "${GREEN}✅ Multi-platform images built and saved!${NC}"
            echo -e "${YELLOW}📦 Files created:${NC}"
            echo "  - werewolf-game-amd64.tar (for Linux x86_64)"
            echo "  - werewolf-game-arm64.tar (for Apple Silicon/ARM64)"
            echo -e "${YELLOW}💡 Transfer the appropriate tar file to your target machine and run:${NC}"
            echo "  docker load < werewolf-game-amd64.tar  # On Linux x86_64"
            echo "  docker load < werewolf-game-arm64.tar  # On ARM64"
        fi
    else
        # Single platform build (current architecture)
        echo -e "${BLUE}🔨 Building for current platform...${NC}"
        docker build -t "$IMAGE_TAG" $BUILD_ARGS .
    fi
    
    # Skip running container if we're pushing to registry
    if [ "$REGISTRY_PUSH" = true ]; then
        return 0
    fi
    
    echo -e "${BLUE}🚀 Starting application...${NC}"
    docker run -d \
        --name werewolf-game \
        --env-file .env \
        -p 3000:80 \
        "$IMAGE_TAG"
    
    echo -e "${GREEN}✅ Application started successfully!${NC}"
    echo -e "${GREEN}🌐 Access your game at: http://localhost:3000${NC}"
    echo -e "${YELLOW}💡 To stop: docker stop werewolf-game${NC}"
    echo -e "${YELLOW}💡 To view logs: docker logs werewolf-game${NC}"
}

# Function to use docker-compose
compose_run() {
    # Pull base images first
    pull_base_images
    
    echo -e "${BLUE}🔨 Starting with docker-compose...${NC}"
    docker-compose up -d --build
    
    echo -e "${GREEN}✅ Application started successfully!${NC}"
    echo -e "${GREEN}🌐 Access your game at: http://localhost:3000${NC}"
    echo -e "${YELLOW}💡 To stop: docker-compose down${NC}"
    echo -e "${YELLOW}💡 To view logs: docker-compose logs${NC}"
}

# Check if compose was requested
USE_COMPOSE=false
for arg in "$@"; do
    if [ "$arg" = "--compose" ] || [ "$arg" = "-c" ]; then
        USE_COMPOSE=true
        break
    fi
done

# Check deployment method
if [ "$USE_COMPOSE" = true ]; then
    compose_run
else
    # Clean up existing container if it exists (unless we're just pushing to registry)
    if [ "$REGISTRY_PUSH" = false ]; then
        if [ "$(docker ps -q -f name=werewolf-game)" ]; then
            echo -e "${YELLOW}🛑 Stopping existing container...${NC}"
            docker stop werewolf-game
        fi
        
        if [ "$(docker ps -aq -f name=werewolf-game)" ]; then
            echo -e "${YELLOW}🗑️  Removing existing container...${NC}"
            docker rm werewolf-game
        fi
    fi
    
    build_and_run
fi 