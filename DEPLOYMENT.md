# 🚀 Werewolf Game - Secure Cloud Deployment Guide

This guide explains how to deploy the Werewolf Game with **secure API key management** using nginx as a reverse proxy. API keys are injected at runtime via nginx, not during the frontend build, ensuring maximum security.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Browser  │────│  nginx Proxy     │────│  External APIs  │
│                 │    │  (API Keys Here) │    │  (Gemini/OpenAI)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                       ┌──────────────────┐
                       │   React App      │
                       │  (Static Files)  │
                       └──────────────────┘
```

### Key Security Features

✅ **API keys never exposed in frontend code**  
✅ **Runtime API key injection via nginx**  
✅ **Rate limiting and CORS protection**  
✅ **Security headers included**  
✅ **Environment-based configuration**

## 📋 Prerequisites

- Docker and Docker Compose installed
- API keys for your chosen AI provider
- Basic understanding of environment variables

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd Werewolf
```

### 2. Configure Environment

```bash
# Copy environment template
cp env.example .env

# Edit with your API keys
nano .env  # or use your preferred editor
```

### 3. Deploy

```bash
# Option 1: Quick deployment with Docker
./deploy.sh

# Option 2: With docker-compose (includes Ollama)
./deploy.sh --compose

# Option 3: Manual docker-compose
docker-compose up -d --build
```

### 4. Access Your Game

🎮 Open your browser to: **http://localhost:3000**

## ⚙️ Configuration

### Environment Variables

Configure your AI provider in the `.env` file:

#### 🤖 Gemini (Google AI)
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

#### 🧠 OpenAI/OpenRouter/Together AI
```env
AI_PROVIDER=openai
OPENAI_API_KEY=your_actual_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_HOST=api.openai.com
```

#### 🏠 Ollama (Local AI)
```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=gemma3:4b
```

### Provider-Specific Examples

<details>
<summary><b>OpenRouter Configuration</b></summary>

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-or-v1-your-openrouter-key
OPENAI_MODEL=anthropic/claude-3-haiku
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_HOST=openrouter.ai
```
</details>

<details>
<summary><b>Together AI Configuration</b></summary>

```env
AI_PROVIDER=openai
OPENAI_API_KEY=your-together-key
OPENAI_MODEL=meta-llama/Llama-3.2-3B-Instruct-Turbo
OPENAI_BASE_URL=https://api.together.xyz/v1
OPENAI_HOST=api.together.xyz
```
</details>

## 🐳 Docker Commands

### Basic Operations
```bash
# Start the application
./deploy.sh

# Stop the application
docker stop werewolf-game

# View logs
docker logs werewolf-game

# Remove container
docker rm werewolf-game
```

### Docker Compose Operations
```bash
# Start with compose
docker-compose up -d --build

# Stop with compose
docker-compose down

# View logs
docker-compose logs

# Pull Ollama model (if using Ollama)
docker-compose exec ollama ollama pull gemma3:4b
```

## 🌐 Cloud Deployment

### Deploy to AWS/GCP/Azure

1. **Build and push to container registry:**
```bash
# Build image
docker build -t werewolf-game .

# Tag for your registry
docker tag werewolf-game your-registry/werewolf-game:latest

# Push to registry
docker push your-registry/werewolf-game:latest
```

2. **Set environment variables in your cloud platform:**
```bash
# Example for AWS ECS/Fargate
AI_PROVIDER=gemini
GEMINI_API_KEY=your_actual_api_key
GEMINI_MODEL=gemini-2.5-flash
```

3. **Deploy with your cloud platform's container service**

### Deploy to Kubernetes

<details>
<summary><b>Kubernetes Deployment Example</b></summary>

```yaml
# kubernetes/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: werewolf-game
spec:
  replicas: 2
  selector:
    matchLabels:
      app: werewolf-game
  template:
    metadata:
      labels:
        app: werewolf-game
    spec:
      containers:
      - name: werewolf-game
        image: your-registry/werewolf-game:latest
        ports:
        - containerPort: 80
        env:
        - name: AI_PROVIDER
          value: "gemini"
        - name: GEMINI_API_KEY
          valueFrom:
            secretKeyRef:
              name: werewolf-secrets
              key: gemini-api-key
        - name: GEMINI_MODEL
          value: "gemini-2.5-flash"
---
apiVersion: v1
kind: Service
metadata:
  name: werewolf-service
spec:
  selector:
    app: werewolf-game
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer
```

```bash
# Deploy to Kubernetes
kubectl apply -f kubernetes/deployment.yaml
```
</details>

## 🔧 Development vs Production

### Development Mode
- Uses `REACT_APP_*` environment variables
- API calls made directly from browser
- Suitable for local development

### Production Mode (nginx proxy)
- API keys injected via nginx at runtime
- All API calls proxied through `/api/*` endpoints
- Maximum security for cloud deployment

The application automatically detects the mode based on `NODE_ENV`.

## 🛡️ Security Features

### API Security
- ✅ API keys never exposed to client
- ✅ Rate limiting (10 requests/second)
- ✅ CORS protection
- ✅ Request timeout protection

### Web Security
- ✅ Security headers (XSS, CSRF protection)
- ✅ Content Security Policy
- ✅ Frame options protection
- ✅ Sensitive file access denied

## 🔍 Troubleshooting

### Common Issues

#### 🔴 "API key not configured" errors
**Solution:** Check your `.env` file and ensure API keys are properly set.

#### 🔴 "Failed to fetch" errors
**Solution:** 
1. Check if the container is running: `docker ps`
2. Check nginx logs: `docker logs werewolf-game`
3. Verify API provider endpoints are accessible

#### 🔴 Ollama connection issues
**Solution:**
1. Ensure Ollama container is running: `docker-compose ps`
2. Pull the required model: `docker-compose exec ollama ollama pull gemma3:4b`
3. Check Ollama logs: `docker-compose logs ollama`

#### 🔴 CORS errors
**Solution:** The nginx configuration handles CORS. If you see CORS errors, check that you're accessing the app through the nginx proxy (port 3000), not directly.

### Health Check

Visit `http://localhost:3000/health` to check if the nginx proxy is working.

### Log Inspection

```bash
# Application logs
docker logs werewolf-game

# Follow logs in real-time
docker logs -f werewolf-game

# Docker compose logs
docker-compose logs -f
```

## 🎯 Performance Optimization

### For Production

1. **Enable gzip compression** (already configured in nginx)
2. **Use a CDN** for static assets
3. **Scale horizontally** with multiple container instances
4. **Use external load balancer** for high availability

### Resource Requirements

| Component | CPU | Memory | Notes |
|-----------|-----|--------|-------|
| nginx + React App | 0.1 CPU | 256MB | Lightweight |
| Ollama (optional) | 2+ CPU | 4GB+ | Resource intensive |

## 🆘 Support

If you encounter issues:

1. Check the logs first: `docker logs werewolf-game`
2. Verify your `.env` configuration
3. Test API connectivity manually
4. Check firewall and network settings

---

## 📄 Files Overview

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage build for React + nginx |
| `nginx.conf.template` | nginx configuration with variable substitution |
| `docker-compose.yml` | Local deployment with Ollama |
| `deploy.sh` | Automated deployment script |
| `env.example` | Environment variables template |

---

🎮 **Happy Gaming!** Your Werewolf game is now securely deployed with enterprise-grade API key management. 