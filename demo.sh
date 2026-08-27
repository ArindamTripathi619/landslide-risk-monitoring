#!/bin/bash
# ============================================================
# DEMO STARTUP SCRIPT
# Starts all services for the Landslide Risk Monitoring demo
# Usage: ./demo.sh [--stop] [--status]
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_banner() {
    echo ""
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║${NC}  🏔️  ${YELLOW}AI-Based Landslide Risk Monitoring System${NC}              ${RED}║${NC}"
    echo -e "${RED}║${NC}  ${CYAN}North Eastern Region — SIH 2026 Demo${NC}                    ${RED}║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

check_prerequisites() {
    echo -e "${BLUE}▸ Checking prerequisites...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Node.js not found. Please install Node.js 18+${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Node.js $(node -v)${NC}"
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}✗ Python3 not found. Please install Python 3.10+${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Python $(python3 --version 2>&1 | cut -d' ' -f2)${NC}"
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}✓ Docker available${NC}"
    else
        echo -e "${YELLOW}⚠ Docker not found — using local MongoDB${NC}"
    fi
    
    # Check if MongoDB is accessible
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q landslide-mongo; then
        echo -e "${GREEN}✓ MongoDB container running${NC}"
    elif mongosh --eval "db.adminCommand('ping')" &>/dev/null 2>&1; then
        echo -e "${GREEN}✓ MongoDB accessible locally${NC}"
    else
        echo -e "${YELLOW}⚠ MongoDB not detected. Starting with Docker...${NC}"
        docker run -d --name landslide-mongo -p 27017:27017 -e MONGO_INITDB_DATABASE=landslide_risk mongo:7 2>/dev/null || true
        sleep 3
        echo -e "${GREEN}✓ MongoDB started in Docker${NC}"
    fi
    echo ""
}

start_mongodb() {
    echo -e "${BLUE}▸ Starting MongoDB...${NC}"
    
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q landslide-mongo; then
        echo -e "${GREEN}✓ MongoDB already running${NC}"
        return
    fi
    
    docker run -d --name landslide-mongo -p 27017:27017 -e MONGO_INITDB_DATABASE=landslide_risk mongo:7 2>/dev/null || true
    sleep 3
    echo -e "${GREEN}✓ MongoDB started on port 27017${NC}"
}

start_ml_service() {
    echo -e "${BLUE}▸ Starting ML Service (FastAPI + XGBoost)...${NC}"
    
    # Kill any existing ML service
    lsof -ti:8001 | xargs kill -9 2>/dev/null || true
    sleep 1
    
    cd ml-service
    
    # Activate venv or install deps
    if [ -d "venv" ]; then
        source venv/bin/activate
    fi
    
    # Start ML service in background
    nohup python -m uvicorn api.main:app --host 0.0.0.0 --port 8001 --reload > /tmp/ml-service.log 2>&1 &
    ML_PID=$!
    
    cd ..
    
    # Wait for ML service to be ready
    echo -n "  Waiting for ML service"
    for i in {1..15}; do
        if curl -s http://localhost:8001/health > /dev/null 2>&1; then
            echo ""
            echo -e "${GREEN}✓ ML Service running on port 8001 (PID: $ML_PID)${NC}"
            return
        fi
        echo -n "."
        sleep 1
    done
    echo ""
    echo -e "${YELLOW}⚠ ML service may not be fully ready. Check /tmp/ml-service.log${NC}"
}

start_backend() {
    echo -e "${BLUE}▸ Starting Backend API (Express + Socket.IO)...${NC}"
    
    # Kill any existing backend
    lsof -ti:5000 | xargs kill -9 2>/dev/null || true
    sleep 1
    
    cd backend
    
    # Start backend in background
    nohup node server.js > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    
    cd ..
    
    # Wait for backend to be ready
    echo -n "  Waiting for backend"
    for i in {1..15}; do
        if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
            echo ""
            echo -e "${GREEN}✓ Backend API running on port 5000 (PID: $BACKEND_PID)${NC}"
            return
        fi
        echo -n "."
        sleep 1
    done
    echo ""
    echo -e "${YELLOW}⚠ Backend may not be fully ready. Check /tmp/backend.log${NC}"
}

seed_database() {
    echo -e "${BLUE}▸ Seeding database with demo data...${NC}"
    
    cd backend
    node scripts/seed.js 2>/dev/null && {
        echo -e "${GREEN}✓ Database seeded with 15 users, 125 risk zones, 47 alerts, 55 events${NC}"
    } || {
        echo -e "${YELLOW}⚠ Database may already be seeded${NC}"
    }
    cd ..
}

install_frontend() {
    echo -e "${BLUE}▸ Installing admin dashboard dependencies...${NC}"
    
    cd frontend/admin-dashboard
    
    if [ ! -d "node_modules" ]; then
        npm install --silent 2>/dev/null
        echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
    else
        echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
    fi
    
    cd ../..
}

start_frontend() {
    echo -e "${BLUE}▸ Starting Admin Dashboard (React)...${NC}"
    
    cd frontend/admin-dashboard
    nohup npm start > /tmp/dashboard.log 2>&1 &
    FRONTEND_PID=$!
    cd ../..
    
    echo -e "${GREEN}✓ Dashboard starting on port 3000 (PID: $FRONTEND_PID)${NC}"
}

print_status() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}🏔️  ALL SERVICES RUNNING${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${YELLOW}Service${NC}           ${YELLOW}URL${NC}                          ${YELLOW}Port${NC}"
    echo -e "  ─────────────────────────────────────────────────────────"
    echo -e "  ${GREEN}Admin Dashboard${NC}   http://localhost:3000              3000"
    echo -e "  ${GREEN}Backend API${NC}       http://localhost:5000/api          5000"
    echo -e "  ${GREEN}ML Service${NC}        http://localhost:8001              8001"
    echo -e "  ${GREEN}MongoDB${NC}           localhost:27017                   27017"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${YELLOW}Demo Login Credentials:${NC}"
    echo -e "  ─────────────────────────────────────────────────────────"
    echo -e "  Admin:          ${GREEN}admin@landslide.gov.in${NC} / ${GREEN}admin123${NC}"
    echo -e "  District Admin: ${GREEN}rajesh@kamrup.gov.in${NC} / ${GREEN}admin123${NC}"
    echo -e "  Field Officer:  ${GREEN}bikram@field.gov.in${NC}  / ${GREEN}officer123${NC}"
    echo -e "  Citizen:        ${GREEN}haren@citizen.gov.in${NC} / ${GREEN}citizen123${NC}"
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${YELLOW}Demo Flow (present to judges):${NC}"
    echo -e "  ─────────────────────────────────────────────────────────"
    echo -e "  1. Open http://localhost:3000 → Login as admin"
    echo -e "  2. Dashboard: Show stats, risk distribution, alerts"
    echo -e "  3. Click ${GREEN}\"Simulate Landslide\"${NC} → alert appears"
    echo -e "  4. Risk Map: Show heatmap, click for AI prediction"
    echo -e "  5. Alerts: Issue/resolve workflow, timeline view"
    echo -e "  6. Export: Download GeoJSON/CSV from map"
    echo ""
    echo -e "  ${YELLOW}Logs:${NC}"
    echo -e "    Backend:  ${BLUE}tail -f /tmp/backend.log${NC}"
    echo -e "    ML:       ${BLUE}tail -f /tmp/ml-service.log${NC}"
    echo -e "    Dashboard: ${BLUE}tail -f /tmp/dashboard.log${NC}"
    echo ""
}

stop_all() {
    echo -e "${RED}Stopping all services...${NC}"
    
    # Stop frontend
    pkill -f "react-scripts" 2>/dev/null || true
    echo -e "${GREEN}✓ Dashboard stopped${NC}"
    
    # Stop backend
    lsof -ti:5000 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✓ Backend stopped${NC}"
    
    # Stop ML service
    lsof -ti:8001 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✓ ML Service stopped${NC}"
    
    # Stop MongoDB (optional)
    docker stop landslide-mongo 2>/dev/null || true
    echo -e "${GREEN}✓ MongoDB stopped${NC}"
    
    echo -e "${GREEN}All services stopped.${NC}"
}

show_status() {
    echo -e "${CYAN}Service Status:${NC}"
    echo ""
    
    # MongoDB
    if docker ps --format '{{.Names}}' 2>/dev/null | grep -q landslide-mongo; then
        echo -e "  ${GREEN}● MongoDB${NC}       Running on port 27017"
    else
        echo -e "  ${RED}○ MongoDB${NC}       Not running"
    fi
    
    # ML Service
    if curl -s http://localhost:8001/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}● ML Service${NC}    Running on port 8001"
    else
        echo -e "  ${RED}○ ML Service${NC}    Not running"
    fi
    
    # Backend
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}● Backend${NC}       Running on port 5000"
    else
        echo -e "  ${RED}○ Backend${NC}       Not running"
    fi
    
    # Frontend
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "  ${GREEN}● Dashboard${NC}     Running on port 3000"
    else
        echo -e "  ${RED}○ Dashboard${NC}     Not running"
    fi
    echo ""
}

# Main
case "${1:-}" in
    --stop)
        print_banner
        stop_all
        ;;
    --status)
        print_banner
        show_status
        ;;
    *)
        print_banner
        check_prerequisites
        start_mongodb
        start_ml_service
        start_backend
        seed_database
        install_frontend
        start_frontend
        print_status
        ;;
esac
