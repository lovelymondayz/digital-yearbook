package database

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPool(ctx context.Context, databaseURL string, logger *slog.Logger) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse database config: %w", err)
	}

	config.MinConns = 2
	config.MaxConns = 10
	config.HealthCheckPeriod = 30 * 60 * 1000000000 // 30s in nanoseconds

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("create connection pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	logger.Info("database connected", "min", config.MinConns, "max", config.MaxConns)
	return pool, nil
}

func RunMigrations(ctx context.Context, pool *pgxpool.Pool, logger *slog.Logger) error {
	migrationsDir := os.Getenv("MIGRATIONS_DIR")
	if migrationsDir == "" {
		migrationsDir = "migrations"
	}

	// Create migrations tracking table
	_, err := pool.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			filename TEXT PRIMARY KEY,
			applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		)
	`)
	if err != nil {
		return fmt.Errorf("create schema_migrations table: %w", err)
	}

	// Get already-applied migrations
	rows, err := pool.Query(ctx, "SELECT filename FROM schema_migrations")
	if err != nil {
		return fmt.Errorf("query applied migrations: %w", err)
	}
	defer rows.Close()

	applied := make(map[string]bool)
	for rows.Next() {
		var fn string
		if err := rows.Scan(&fn); err != nil {
			return err
		}
		applied[fn] = true
	}

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("read migrations dir %s: %w", migrationsDir, err)
	}

	var upFiles []string
	for _, entry := range entries {
		name := entry.Name()
		if strings.HasSuffix(name, ".up.sql") {
			upFiles = append(upFiles, name)
		}
	}

	// Simple sort (files are numbered 000, 001, etc.)
	for i := 0; i < len(upFiles); i++ {
		for j := i + 1; j < len(upFiles); j++ {
			if upFiles[i] > upFiles[j] {
				upFiles[i], upFiles[j] = upFiles[j], upFiles[i]
			}
		}
	}

	appliedCount := 0
	for _, name := range upFiles {
		if applied[name] {
			continue // already applied
		}

		content, err := os.ReadFile(migrationsDir + "/" + name)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", name, err)
		}

		_, err = pool.Exec(ctx, string(content))
		if err != nil {
			return fmt.Errorf("execute migration %s: %w", name, err)
		}

		_, err = pool.Exec(ctx, "INSERT INTO schema_migrations (filename) VALUES ($1)", name)
		if err != nil {
			return fmt.Errorf("record migration %s: %w", name, err)
		}

		appliedCount++
		logger.Info("migration applied", "file", name)
	}

	if appliedCount > 0 {
		logger.Info("migrations complete", "new", appliedCount, "total", len(upFiles))
	} else {
		logger.Info("all migrations already applied", "total", len(upFiles))
	}
	return nil
}
