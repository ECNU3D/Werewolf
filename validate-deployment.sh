#!/bin/bash

# Werewolf Game Deployment Validation Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐺 Werewolf Game Deployment Validation${NC}"
echo "======================================"

# Initialize counters
CHECKS_PASSED=0
CHECKS_TOTAL=0

# Function to check file existence and content
check_file() {
    local file=$1
    local description=$2
    local required_content=$3
    
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    
    if [[ -f "$file" ]]; then
        if [[ -z "$required_content" ]] || grep -q "$required_content" "$file"; then
            echo -e "${GREEN}✅ $description${NC}"
            CHECKS_PASSED=$((CHECKS_PASSED + 1))
        else
            echo -e "${RED}❌ $description (missing required content: $required_content)${NC}"
        fi
    else
        echo -e "${RED}❌ $description (file not found)${NC}"
    fi
}

# Function to check file permissions
check_executable() {
    local file=$1
    local description=$2
    
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    
    if [[ -x "$file" ]]; then
        echo -e "${GREEN}✅ $description${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}❌ $description (not executable)${NC}"
    fi
}

echo -e "${BLUE}📋 Checking deployment files...${NC}"

# Check core deployment files
check_file "Dockerfile" "Dockerfile exists" "multi-stage build"
check_file "nginx.conf.template" "nginx configuration template exists" "proxy_pass"
check_file "docker-compose.yml" "docker-compose.yml exists" "werewolf-app"
check_file "env.example" "Environment template exists" "AI_PROVIDER"
check_executable "deploy.sh" "Deploy script is executable"

# Check modified source files
check_file "src/utils/aiUtils.js" "AI utils modified for proxy support" "useProxy"

echo ""
echo -e "${BLUE}🔍 Checking configuration completeness...${NC}"

# Check nginx template variables
NGINX_VARS=("GEMINI_API_KEY" "OPENAI_API_KEY" "OLLAMA_BASE_URL")
for var in "${NGINX_VARS[@]}"; do
    CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
    if grep -q "\${$var}" nginx.conf.template; then
        echo -e "${GREEN}✅ nginx template includes $var substitution${NC}"
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
    else
        echo -e "${RED}❌ nginx template missing $var substitution${NC}"
    fi
done

# Check Docker entrypoint
CHECKS_TOTAL=$((CHECKS_TOTAL + 1))
if grep -q "envsubst" Dockerfile; then
    echo -e "${GREEN}✅ Dockerfile includes environment variable substitution${NC}"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
else
    echo -e "${RED}❌ Dockerfile missing envsubst setup${NC}"
fi

echo ""
echo -e "${BLUE}🛠️  Checking prerequisites...${NC}"

# Check for Docker
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker is installed${NC}"
else
    echo -e "${YELLOW}⚠️  Docker not found (required for deployment)${NC}"
fi

# Check for docker-compose
if command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose is installed${NC}"
else
    echo -e "${YELLOW}⚠️  Docker Compose not found (required for full deployment)${NC}"
fi

# Check for Node.js (for development)
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js is installed ($NODE_VERSION)${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js not found (required for development)${NC}"
fi

echo ""
echo -e "${BLUE}📊 Validation Results${NC}"
echo "===================="

if [[ $CHECKS_PASSED -eq $CHECKS_TOTAL ]]; then
    echo -e "${GREEN}🎉 All checks passed! ($CHECKS_PASSED/$CHECKS_TOTAL)${NC}"
    echo -e "${GREEN}Your deployment configuration is ready!${NC}"
    echo ""
    echo -e "${BLUE}🚀 Next steps:${NC}"
    echo "1. Copy env.example to .env: cp env.example .env"
    echo "2. Edit .env with your API keys"
    echo "3. Run deployment: ./deploy.sh"
    echo "4. Access your game at: http://localhost:3000"
else
    echo -e "${RED}❌ Some checks failed ($CHECKS_PASSED/$CHECKS_TOTAL passed)${NC}"
    echo -e "${YELLOW}Please fix the issues above before deploying${NC}"
fi

echo ""
echo -e "${BLUE}🔧 Architecture Summary${NC}"
echo "====================="
echo "✅ Frontend: React app (no API keys exposed)"
echo "✅ Backend: nginx proxy with API key injection"
echo "✅ Security: Runtime environment variable substitution"
echo "✅ Deployment: Multi-stage Docker build"
echo "✅ Development: Backward compatible with REACT_APP_ vars"

echo ""
echo -e "${BLUE}📖 For detailed deployment instructions, see:${NC}"
echo "- DEPLOYMENT.md - Complete deployment guide"
echo "- env.example - Configuration template"
echo "- deploy.sh --help - Deployment script usage" 