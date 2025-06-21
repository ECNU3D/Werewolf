#!/bin/bash

# Quick start script for Werewolf Game
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐺 Starting Werewolf Game...${NC}"

# Check if container already exists and is running
if [ "$(docker ps -q -f name=werewolf-game)" ]; then
    echo -e "${YELLOW}⚠️  Container is already running!${NC}"
    echo -e "${GREEN}🌐 Access your game at: http://localhost:3000${NC}"
    exit 0
fi

# Check if container exists but is stopped
if [ "$(docker ps -aq -f name=werewolf-game)" ]; then
    echo -e "${YELLOW}🔄 Starting existing container...${NC}"
    docker start werewolf-game
else
    echo -e "${YELLOW}❌ No werewolf-game container found!${NC}"
    echo "Please run './deploy.sh' first to build and create the container."
    exit 1
fi

echo -e "${GREEN}✅ Werewolf Game started successfully!${NC}"
echo -e "${GREEN}🌐 Access your game at: http://localhost:3000${NC}"
echo -e "${YELLOW}💡 To stop: ./stop.sh${NC}"
echo -e "${YELLOW}💡 To view logs: docker logs werewolf-game${NC}" 