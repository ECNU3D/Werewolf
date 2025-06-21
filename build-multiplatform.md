# Multi-Platform Docker Builds

## Problem
When building Docker images on Apple Silicon (ARM64) and trying to run them on Linux servers (AMD64), you'll get the error:
```
no matching manifest for linux/amd64
```

## Solutions

### Option 1: Build Multi-Platform Locally (Recommended)
```bash
# Build for both AMD64 and ARM64, save as tar files
./deploy.sh --multi-platform

# This creates:
# - werewolf-game-amd64.tar (for Linux x86_64 servers)
# - werewolf-game-arm64.tar (for Apple Silicon/ARM64)
```

**Transfer to your Linux server:**
```bash
# Copy the AMD64 tar file to your Linux server
scp werewolf-game-amd64.tar user@your-server:/path/to/werewolf/

# On your Linux server:
docker load < werewolf-game-amd64.tar
docker run -d --name werewolf-game --env-file .env -p 3000:80 werewolf-game
```

### Option 2: Push to Docker Registry
```bash
# Build and push to Docker Hub (or other registry)
./deploy.sh --multi-platform --push --tag yourusername/werewolf-game:latest

# On your Linux server:
docker pull yourusername/werewolf-game:latest
docker run -d --name werewolf-game --env-file .env -p 3000:80 yourusername/werewolf-game:latest
```

### Option 3: Regular Build (Current Platform Only)
```bash
# Build for current platform only (default behavior)
./deploy.sh
```

## Requirements
- Docker Desktop with BuildKit enabled
- For registry push: Docker Hub account or other registry access

## Available Commands
```bash
./deploy.sh                                    # Build and run locally
./deploy.sh --multi-platform                  # Build multi-platform locally
./deploy.sh --multi-platform --push --tag username/werewolf-game:latest
./deploy.sh --compose                         # Use docker-compose
./deploy.sh --help                           # Show help
``` 