.PHONY: build test migrate run clean

build:
	cd backend && CGO_ENABLED=0 go build -ldflags="-w -s" -o bin/server ./cmd/server

test:
	cd backend && go test ./... -v -count=1

migrate:
	cd backend && go run ./cmd/migrate

run:
	cd backend && go run ./cmd/server

clean:
	rm -rf backend/bin/

tidy:
	cd backend && go mod tidy

lint:
	cd backend && go vet ./...
