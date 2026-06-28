.PHONY: dev build up down migrate logs clean

# Start development environment (Docker DB + Go backend + Vite frontend)
dev:
	docker compose up -d db
	cd backend && go run . &
	cd frontend && npm run dev
	@echo "Backend: http://localhost:8081 | Frontend: http://localhost:5173"

# Production build
build:
	cd frontend && npm ci && npm run build
	cd backend && go build -o yearbook-api .
	@echo "Build complete"

# Docker operations
up:
	docker compose up -d --build
	@echo "Yearbook running — FE: http://localhost:3001, BE: http://localhost:8081"

down:
	docker compose down

# Database
psql:
	docker compose exec db psql -U yearbook -d yearbook

migrate-up:
	@echo "Migrations run automatically on backend startup"

migrate-down:
	@echo "Run down migrations manually via psql"

# Deploy (push to GitHub first, then run this)
deploy:
	bash /root/hermes/scripts/update.sh digital-yearbook

# Utility
logs:
	docker compose logs -f

clean:
	docker compose down -v
	rm -rf frontend/dist backend/yearbook-api
