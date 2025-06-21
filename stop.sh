#!/bin/bash

# Quick stop script for Werewolf Game
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐺 Stopping Werewolf Game...${NC}"

# Check if container is running
if [ "$(docker ps -q -f name=werewolf-game)" ]; then
    echo -e "${YELLOW}🛑 Stopping container...${NC}"
    docker stop werewolf-game
    echo -e "${GREEN}✅ Werewolf Game stopped successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Container is not running.${NC}"
fi

echo -e "${YELLOW}💡 To start again: ./start.sh${NC}"
echo -e "${YELLOW}💡 To rebuild: ./deploy.sh${NC}" 