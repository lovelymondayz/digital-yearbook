package config

import (
	"log/slog"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Environment  string
	Port         int
	DatabaseURL  string
	JWTSecret    string
	JWTIssuer    string
	AccessExpiry  time.Duration
	RefreshExpiry time.Duration
	AllowedOrigins []string
	ImmichURL    string
	ImmichAPIKey string
	LogLevel     slog.Level
}

func Load() *Config {
	_ = godotenv.Load()

	port, _ := strconv.Atoi(getEnv("PORT", "8080"))
	accessMin, _ := strconv.Atoi(getEnv("JWT_ACCESS_EXPIRY_MINUTES", "15"))
	refreshDays, _ := strconv.Atoi(getEnv("JWT_REFRESH_EXPIRY_DAYS", "7"))

	level := slog.LevelInfo
	if getEnv("LOG_LEVEL", "info") == "debug" {
		level = slog.LevelDebug
	}

	return &Config{
		Environment:   getEnv("ENVIRONMENT", "development"),
		Port:          port,
		DatabaseURL:   getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/yearbook?sslmode=disable"),
		JWTSecret:     getEnv("JWT_SECRET", "change-me-in-production"),
		JWTIssuer:     getEnv("JWT_ISSUER", "digital-yearbook"),
		AccessExpiry:  time.Duration(accessMin) * time.Minute,
		RefreshExpiry: time.Duration(refreshDays) * 24 * time.Hour,
		AllowedOrigins: []string{
			getEnv("FRONTEND_URL", "http://localhost:5173"),
			getEnv("FRONTEND_URL_PROD", "https://yearbook.client.arjism.com"),
		},
		ImmichURL:    getEnv("IMMICH_URL", "https://storage.arjism.com"),
		ImmichAPIKey: getEnv("IMMICH_API_KEY", ""),
		LogLevel:     level,
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
