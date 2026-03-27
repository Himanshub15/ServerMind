#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────
# ServerMind — Start backend + frontend
# ─────────────────────────────────────────────

DIR="$(cd "$(dirname "$0")" && pwd)"
CYAN='\033[0;36m'
GREEN='\033[0;32m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# Run setup if not done yet
if [ ! -d "$DIR/backend/venv" ] || [ ! -d "$DIR/frontend/node_modules" ]; then
  bash "$DIR/setup.sh"
  echo ""
fi

# Load user config
BACKEND_PORT=8000
FRONTEND_PORT=5173
if [ -f "$DIR/.servermind.conf" ]; then
  source "$DIR/.servermind.conf"
fi

cleanup() {
  echo ""
  echo -e "  ${DIM}Shutting down...${NC}"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo -e "  ${GREEN}Stopped. See you next time.${NC}"
  echo ""
}
trap cleanup EXIT INT TERM

echo ""
echo -e "  ${CYAN}${BOLD}Starting ServerMind...${NC}"
echo ""

# ── Start backend ────────────────────────────
cd "$DIR/backend"
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port "$BACKEND_PORT" 2>&1 | sed 's/^/  [api] /' &
BACKEND_PID=$!

# ── Start frontend ───────────────────────────
cd "$DIR/frontend"
npx vite --host --port "$FRONTEND_PORT" 2>&1 | sed 's/^/  [web] /' &
FRONTEND_PID=$!

# Wait for servers to boot
sleep 3

echo ""
echo -e "  ${GREEN}${BOLD}╔═════════════════════════════════════════════╗${NC}"
echo -e "  ${GREEN}${BOLD}║                                             ║${NC}"
echo -e "  ${GREEN}${BOLD}║   ServerMind is live                        ║${NC}"
echo -e "  ${GREEN}${BOLD}║                                             ║${NC}"
echo -e "  ${GREEN}${BOLD}║   Dashboard:  http://localhost:${FRONTEND_PORT}$(printf '%*s' $((14 - ${#FRONTEND_PORT})) '')║${NC}"
echo -e "  ${GREEN}${BOLD}║   API:        http://localhost:${BACKEND_PORT}$(printf '%*s' $((14 - ${#BACKEND_PORT})) '')║${NC}"
echo -e "  ${GREEN}${BOLD}║                                             ║${NC}"
echo -e "  ${GREEN}${BOLD}║   Ctrl+C to stop                            ║${NC}"
echo -e "  ${GREEN}${BOLD}║                                             ║${NC}"
echo -e "  ${GREEN}${BOLD}╚═════════════════════════════════════════════╝${NC}"
echo ""

wait
