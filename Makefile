UI_DIR ?= ui
BACKEND_DIR ?= backend

BACKEND_APP ?= app.main:app
BACKEND_APP_DIR ?= src
BACKEND_HOST ?= 127.0.0.1
BACKEND_PORT ?= 8000
BACKEND_ENV_FILE ?=

.PHONY: install install-ui install-backend run run-ui run-backend

install: install-ui install-backend

install-ui:
	@echo "Installing UI dependencies with pnpm..."
	@cd $(UI_DIR) && pnpm install

install-backend:
	@echo "Syncing backend environment with uv..."
	@cd $(BACKEND_DIR) && uv sync

run: ## Run UI and backend together
	@echo "Starting UI and backend. Press Ctrl-C to stop both."
	@set -e; \
	  $(MAKE) --no-print-directory run-ui & UI_PID=$$!; \
	  $(MAKE) --no-print-directory run-backend & BACKEND_PID=$$!; \
	  trap 'echo; echo "Stopping services..."; kill $$UI_PID $$BACKEND_PID 2>/dev/null || true; wait $$UI_PID $$BACKEND_PID 2>/dev/null; exit 0' INT TERM; \
	  wait $$UI_PID $$BACKEND_PID

run-ui:
	@echo "Running UI (pnpm run dev)..."
	@cd $(UI_DIR) && exec pnpm run dev

run-backend:
	@echo "Running backend (uv run uvicorn)..."
	@cd $(BACKEND_DIR) && \
	  ENV_ARGS=""; \
	  if [ -n "$(BACKEND_ENV_FILE)" ]; then \
	    if [ -f "$(BACKEND_ENV_FILE)" ]; then \
	      ENV_ARGS="--env-file $(BACKEND_ENV_FILE)"; \
	    else \
	      echo "Warning: BACKEND_ENV_FILE '$(BACKEND_ENV_FILE)' not found; continuing without it." >&2; \
	    fi; \
	  fi; \
	  exec uv run $$ENV_ARGS uvicorn $(BACKEND_APP) --app-dir $(BACKEND_APP_DIR) --reload --host $(BACKEND_HOST) --port $(BACKEND_PORT)
