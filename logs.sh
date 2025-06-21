#!/bin/bash

# Quick logs script for Werewolf Game
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐺 Werewolf Game Logs${NC}"
echo -e "${YELLOW}Press Ctrl+C to exit logs${NC}"
echo "=================================="

# Check if container exists
if [ "$(docker ps -aq -f name=werewolf-game)" ]; then
    # Follow logs with timestamps
    docker logs -f --timestamps werewolf-game
else
    echo -e "${YELLOW}❌ No werewolf-game container found!${NC}"
    echo "Please run './deploy.sh' first to build and create the container."
    exit 1
fi 