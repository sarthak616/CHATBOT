#!/usr/bin/env bash
# ============================================================
#  Nexus Search — Quick Setup Script
# ============================================================
set -e

BOLD='\033[1m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BOLD}${BLUE}"
echo "  ███╗   ██╗███████╗██╗  ██╗██╗   ██╗███████╗"
echo "  ████╗  ██║██╔════╝╚██╗██╔╝██║   ██║██╔════╝"
echo "  ██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║███████╗"
echo "  ██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║╚════██║"
echo "  ██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝███████║"
echo "  ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝"
echo -e "${NC}"
echo -e "${BOLD}  AI-Powered Smart Search Engine — Setup${NC}"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js not found. Please install Node.js 18+ first.${NC}"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 18+ required (found: $(node -v))${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Copy .env
if [ ! -f "server/.env" ]; then
  echo -e "${YELLOW}📋 Creating server/.env from template...${NC}"
  cp .env.example server/.env
  echo -e "${YELLOW}⚠️  Please edit server/.env with your API keys before starting!${NC}"
fi

# Install dependencies
echo ""
echo -e "${BLUE}📦 Installing server dependencies...${NC}"
cd server && npm install && cd ..

echo -e "${BLUE}📦 Installing client dependencies...${NC}"
cd client && npm install && cd ..

echo ""
echo -e "${GREEN}${BOLD}✅ Setup complete!${NC}"
echo ""
echo -e "  ${BOLD}Next steps:${NC}"
echo -e "  1. Edit ${YELLOW}server/.env${NC} with your API keys:"
echo -e "     - OPENAI_API_KEY (required)"
echo -e "     - SERPAPI_KEY (required for web search)"
echo -e "     - MONGODB_URI (default: local MongoDB)"
echo -e "     - JWT_SECRET (change this!)"
echo ""
echo -e "  2. Start development servers:"
echo -e "     ${BLUE}Terminal 1:${NC} cd server && npm run dev"
echo -e "     ${BLUE}Terminal 2:${NC} cd client && npm start"
echo ""
echo -e "  3. Or use Docker Compose:"
echo -e "     ${BLUE}docker-compose up${NC}"
echo ""
echo -e "  App: ${BLUE}http://localhost:3000${NC}"
echo -e "  API: ${BLUE}http://localhost:5000${NC}"
echo -e "  Health: ${BLUE}http://localhost:5000/health${NC}"
echo ""
