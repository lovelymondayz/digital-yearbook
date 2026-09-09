# CONSTITUTION.md — Digital Yearbook

> This project adheres to the [Hermes Engineering Constitution](/root/hermes/CONSTITUTION.md) (v1.0, ratified 2026-06-10).
> All sections apply unless noted below.

## Project-Specific Exceptions

None. Full compliance with the global constitution.

## Project Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Backend | Go 1.22+ + Gin + pgx/v5 |
| Database | PostgreSQL 16 |
| Container | Docker + Docker Compose |

## API Versioning

All endpoints live under `/api/v1/`.

## Error Shape

```json
{
  "error": {
    "code": "ERROR",
    "message": "Human-readable description"
  }
}
```
