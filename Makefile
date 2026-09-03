.PHONY: dev build up down logs clean deploy

# Start development environment
dev:
	cd backend && go run . &
	cd frontend && npm run dev
	@echo "Backend: http://localhost:8081 | Frontend: http://localhost:3001"

# Production build
build:
	cd frontend && npm ci && npm run build
	cd backend && go build -o yearbook-api .
	@echo "Build complete"

# Docker operations
up:
	docker compose up -d --build
	@echo "Digital Yearbook running — FE: http://localhost:3001, BE: http://localhost:8081"

down:
	docker compose down

# Utility
logs:
	docker compose logs -f

clean:
	docker compose down -v
	rm -rf frontend/dist backend/yearbook-api

deploy:
	./update.sh