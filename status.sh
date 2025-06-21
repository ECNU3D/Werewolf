#!/bin/bash

# Quick status script for Werewolf Game
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐺 Werewolf Game Status${NC}"
echo "=================================="

# Check if container exists and is running
if [ "$(docker ps -q -f name=werewolf-game)" ]; then
    echo -e "${GREEN}✅ Status: RUNNING${NC}"
    echo -e "${GREEN}🌐 Access your game at: http://localhost:3000${NC}"
    echo ""
    echo "Container Details:"
    docker ps --filter name=werewolf-game --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
elif [ "$(docker ps -aq -f name=werewolf-game)" ]; then
    echo -e "${YELLOW}⏸️  Status: STOPPED${NC}"
    echo -e "${YELLOW}💡 Run './start.sh' to start the game${NC}"
    echo ""
    echo "Container Details:"
    docker ps -a --filter name=werewolf-game --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
else
    echo -e "${RED}❌ Status: NOT DEPLOYED${NC}"
    echo -e "${YELLOW}💡 Run './deploy.sh' to build and deploy the game${NC}"
fi

echo ""
echo "Available Commands:"
echo "  ./deploy.sh  - Build and deploy the game"
echo "  ./start.sh   - Start the game container"
echo "  ./stop.sh    - Stop the game container"
echo "  ./logs.sh    - View container logs"
echo "  ./status.sh  - Check container status" 