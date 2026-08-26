#!/bin/bash
set -e

# ============================================================
# 🏔️ Landslide Risk Monitoring System — Quick Start
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════╗"
echo "║   🏔️  Landslide Risk Monitoring System (SIH 2026)  ║"
echo "║   North-East India Disaster Management             ║"
echo "╚══════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Docker is available
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo -e "${GREEN}✅ Docker found${NC}"
    MODE="docker"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose found${NC}"
    MODE="compose"
else
    echo -e "${YELLOW}⚠️  Docker not found — using local mode${NC}"
    MODE="local"
fi

case "$1" in
    --docker|-d)
        echo -e "\n${BLUE}🐳 Starting with Docker Compose...${NC}"
        docker compose up --build -d
        echo -e "\n${GREEN}All services running:${NC}"
        echo "  📊 Dashboard:  http://localhost:3000"
        echo "  🔌 API:        http://localhost:5000"
        echo "  🧠 ML Service: http://localhost:8000"
        echo "  🗄️  MongoDB:    localhost:27017"
        echo ""
        echo -e "${YELLOW}To seed the database:${NC}"
        echo "  docker exec landslide-backend node scripts/seed.js"
        echo -e "${YELLOW}To view logs:${NC}"
        echo "  docker compose logs -f"
        ;;

    --seed|-s)
        echo -e "\n${BLUE}🌱 Seeding database with demo data...${NC}"
        cd backend
        if [ -f ".env" ]; then
            node scripts/seed.js
        else
            echo -e "${YELLOW}Creating .env from template...${NC}"
            cp .env.example .env
            node scripts/seed.js
        fi
        cd ..
        ;;

    --train|-t)
        echo -e "\n${BLUE}🤖 Training ML model...${NC}"
        cd ml-service
        python scripts/prepare_datasets.py
        python scripts/train_model.py
        cd ..
        ;;

    --stop)
        echo -e "\n${RED}🛑 Stopping all services...${NC}"
        docker compose down
        ;;

    --clean)
        echo -e "\n${RED}🧹 Cleaning up...${NC}"
        docker compose down -v
        rm -rf backend/node_modules ml-service/__pycache__ frontend/admin-dashboard/node_modules
        echo -e "${GREEN}Cleaned!${NC}"
        ;;

    *)
        echo -e "${CYAN}Usage:${NC}"
        echo "  ./start.sh              — Start all services locally"
        echo "  ./start.sh --docker     — Start with Docker Compose"
        echo "  ./start.sh --seed       — Seed database with demo data"
        echo "  ./start.sh --train      — Retrain ML model"
        echo "  ./start.sh --stop       — Stop Docker services"
        echo "  ./start.sh --clean      — Remove Docker volumes + node_modules"
        echo ""

        if [ "$MODE" = "local" ]; then
            echo -e "${BLUE}📦 Starting in local mode...${NC}"
            echo ""

            # Start ML service
            echo -e "${YELLOW}🧠 Starting ML service (port 8000)...${NC}"
            cd ml-service
            if [ ! -d "venv" ]; then
                python -m venv venv
                source venv/bin/activate
                pip install -r requirements.txt > /dev/null 2>&1
            else
                source venv/bin/activate
            fi
            uvicorn api.main:app --host 0.0.0.0 --port 8000 &
            ML_PID=$!
            cd ..

            # Start backend
            echo -e "${YELLOW}🔌 Starting backend API (port 5000)...${NC}"
            cd backend
            if [ ! -f ".env" ]; then
                cp .env.example .env
            fi
            if [ ! -d "node_modules" ]; then
                npm install > /dev/null 2>&1
            fi
            node server.js &
            API_PID=$!
            cd ..

            # Start frontend
            echo -e "${YELLOW}📊 Starting admin dashboard (port 3000)...${NC}"
            cd frontend/admin-dashboard
            if [ ! -d "node_modules" ]; then
                npm install > /dev/null 2>&1
            fi
            npm start &
            FE_PID=$!
            cd ../..

            echo ""
            echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
            echo -e "${GREEN}All services started! 🚀${NC}"
            echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
            echo ""
            echo "  📊 Dashboard:  http://localhost:3000"
            echo "  🔌 API:        http://localhost:5000/api/health"
            echo "  🧠 ML Service: http://localhost:8000/docs"
            echo ""
            echo -e "${YELLOW}To seed database:${NC}"
            echo "  cd backend && node scripts/seed.js"
            echo ""
            echo -e "${RED}Press Ctrl+C to stop all services${NC}"
            
            # Wait for any process to exit
            wait
        fi
        ;;
esac
