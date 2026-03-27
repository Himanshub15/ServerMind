#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────
# ServerMind — Interactive one-command setup
# ─────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

DIR="$(cd "$(dirname "$0")" && pwd)"

clear 2>/dev/null || true

echo ""
echo -e "${CYAN}${BOLD}"
echo "   ╔════════════════════════════════════════════════════╗"
echo "   ║                                                    ║"
echo "   ║     ███████╗███████╗██████╗ ██╗   ██╗███████╗     ║"
echo "   ║     ██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝     ║"
echo "   ║     ███████╗█████╗  ██████╔╝██║   ██║█████╗       ║"
echo "   ║     ╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝       ║"
echo "   ║     ███████║███████╗██║  ██║ ╚████╔╝ ███████╗     ║"
echo "   ║     ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝     ║"
echo "   ║                                                    ║"
echo "   ║        ${NC}${CYAN}Server-Resident AI Monitoring Agent${BOLD}         ║"
echo "   ║                                                    ║"
echo "   ╚════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "  ${DIM}Real-time server monitoring with live metrics, ETL"
echo -e "  pipeline tracking, anomaly detection, and AI chat.${NC}"
echo ""

# ── Helper ───────────────────────────────────
ask() {
  local prompt="$1" default="$2" reply
  echo -ne "  ${BOLD}${prompt}${NC} "
  read -r reply
  echo "${reply:-$default}"
}

step() {
  echo ""
  echo -e "  ${CYAN}[$1/4]${NC} ${BOLD}$2${NC}"
}

ok() {
  echo -e "        ${GREEN}done${NC} $1"
}

fail() {
  echo -e "        ${RED}$1${NC}"
}

# ══════════════════════════════════════════════
# STEP 1 — Check prerequisites
# ══════════════════════════════════════════════
step 1 "Checking your system..."

# Python
PYTHON=""
for cmd in python3 python; do
  if command -v "$cmd" &>/dev/null; then
    version=$("$cmd" -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>/dev/null)
    major=$(echo "$version" | cut -d. -f1)
    minor=$(echo "$version" | cut -d. -f2)
    if [ "$major" -ge 3 ] && [ "$minor" -ge 9 ]; then
      PYTHON="$cmd"
      break
    fi
  fi
done

if [ -z "$PYTHON" ]; then
  fail "Python 3.9+ not found"
  echo ""
  echo -e "  ${YELLOW}Install Python first:${NC}"
  echo -e "    ${DIM}macOS${NC}   brew install python3"
  echo -e "    ${DIM}Ubuntu${NC}  sudo apt install python3 python3-venv python3-pip"
  echo -e "    ${DIM}RHEL${NC}    sudo dnf install python3"
  echo ""
  exit 1
fi
ok "Python $($PYTHON --version 2>&1 | awk '{print $2}')"

# Node.js
if ! command -v node &>/dev/null; then
  fail "Node.js 18+ not found"
  echo ""
  echo -e "  ${YELLOW}Install Node.js first:${NC}"
  echo -e "    ${DIM}macOS${NC}   brew install node"
  echo -e "    ${DIM}Ubuntu${NC}  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs"
  echo -e "    ${DIM}Any${NC}     https://nodejs.org"
  echo ""
  exit 1
fi
NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VER" -lt 18 ]; then
  fail "Node.js 18+ required, found $(node -v)"
  exit 1
fi
ok "Node.js $(node -v)"

# ══════════════════════════════════════════════
# STEP 2 — Configuration
# ══════════════════════════════════════════════
step 2 "Quick configuration..."

echo ""

# Port selection
BACKEND_PORT=$(ask "Backend port [8000]:" "8000")
FRONTEND_PORT=$(ask "Frontend port [5173]:" "5173")

echo ""

# AI key
echo -e "  ${BOLD}AI Features ${DIM}(optional — powers alert summaries & chat)${NC}"
echo -e "  ${DIM}Get a free key at: https://build.nvidia.com${NC}"
echo ""
AI_KEY=$(ask "NVIDIA API key [skip]:" "")

if [ -n "$AI_KEY" ] && [ "$AI_KEY" != "skip" ]; then
  echo -e "        ${GREEN}AI features will be enabled${NC}"
  AI_ENABLED=true
else
  echo -e "        ${DIM}Skipped — dashboard works fully without it.${NC}"
  echo -e "        ${DIM}You can add it later in backend/.env${NC}"
  AI_ENABLED=false
fi

# ══════════════════════════════════════════════
# STEP 3 — Install dependencies
# ══════════════════════════════════════════════
step 3 "Installing dependencies..."

# Backend
echo -e "        ${DIM}Setting up Python environment...${NC}"
cd "$DIR/backend"

if [ ! -d "venv" ]; then
  $PYTHON -m venv venv
fi

source venv/bin/activate
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
deactivate
ok "Python packages installed"

# Write .env
cat > "$DIR/backend/.env" <<EOF
NVIDIA_API_KEY=${AI_KEY}
BACKEND_PORT=${BACKEND_PORT}
EOF
ok "Config saved to backend/.env"

# Frontend
echo -e "        ${DIM}Installing frontend packages...${NC}"
cd "$DIR/frontend"
npm install --silent 2>/dev/null
ok "Frontend packages installed"

# Update vite config if non-default ports
if [ "$BACKEND_PORT" != "8000" ]; then
  # Patch vite proxy target to use custom backend port
  sed -i.bak "s|http://localhost:8000|http://localhost:${BACKEND_PORT}|g" "$DIR/frontend/vite.config.js"
  sed -i.bak "s|ws://localhost:8000|ws://localhost:${BACKEND_PORT}|g" "$DIR/frontend/vite.config.js"
  rm -f "$DIR/frontend/vite.config.js.bak"
fi

# ══════════════════════════════════════════════
# STEP 4 — Write start script with user config
# ══════════════════════════════════════════════
step 4 "Finalizing..."

# Save port config for start.sh to read
cat > "$DIR/.servermind.conf" <<EOF
BACKEND_PORT=${BACKEND_PORT}
FRONTEND_PORT=${FRONTEND_PORT}
EOF
ok "Configuration saved"

# ══════════════════════════════════════════════
# Done
# ══════════════════════════════════════════════
echo ""
echo ""
echo -e "  ${GREEN}${BOLD}Setup complete!${NC}"
echo ""
echo -e "  ${BOLD}Your configuration:${NC}"
echo -e "    Dashboard   ${CYAN}http://localhost:${FRONTEND_PORT}${NC}"
echo -e "    API         ${CYAN}http://localhost:${BACKEND_PORT}${NC}"
if [ "$AI_ENABLED" = true ]; then
  echo -e "    AI Chat     ${GREEN}enabled${NC}"
else
  echo -e "    AI Chat     ${DIM}disabled (add key to backend/.env later)${NC}"
fi
echo ""
echo -e "  ${BOLD}What's included:${NC}"
echo -e "    ${DIM}*${NC} Live CPU, memory, disk, network monitoring"
echo -e "    ${DIM}*${NC} Per-core CPU bars & process table (htop-style)"
echo -e "    ${DIM}*${NC} 5 simulated ETL pipelines with failure tracking"
echo -e "    ${DIM}*${NC} Anomaly detection & alert feed"
if [ "$AI_ENABLED" = true ]; then
  echo -e "    ${DIM}*${NC} AI-powered alert summaries & chat"
fi
echo ""
echo -e "  ${BOLD}Start ServerMind:${NC}"
echo ""
echo -e "    ${CYAN}./start.sh${NC}"
echo ""
