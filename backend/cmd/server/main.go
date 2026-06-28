package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chicors "github.com/go-chi/cors"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/config"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/database"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/handler"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/middleware"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/service"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Initialize logger
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: cfg.LogLevel,
	}))
	slog.SetDefault(logger)

	// Connect to database
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pool, err := database.NewPool(ctx, cfg.DatabaseURL, logger)
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	// Run migrations
	if err := database.RunMigrations(ctx, pool, logger); err != nil {
		logger.Error("failed to run migrations", "error", err)
		os.Exit(1)
	}

	// Initialize services
	authService := service.NewAuthService(cfg, pool)
	yearbookService := service.NewYearbookService(pool)
	searchService := service.NewSearchService(pool)
	immichService := service.NewImmichService(cfg.ImmichURL, cfg.ImmichAPIKey)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authService)
	yearbookHandler := handler.NewYearbookHandler(yearbookService)
	flipbookHandler := handler.NewFlipbookHandler(yearbookService, immichService)
	searchHandler := handler.NewSearchHandler(searchService)
	healthHandler := handler.NewHealthHandler(cfg)
	analyticsHandler := handler.NewAnalyticsHandler()
	bookmarkHandler := handler.NewBookmarkHandler()
	uploadHandler := handler.NewUploadHandler(immichService)

	// Setup router
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.Recovery)
	r.Use(middleware.SecurityHeaders)
	r.Use(middleware.Logger(logger))
	r.Use(middleware.CORS(cfg.AllowedOrigins))
	r.Use(chicors.Handler(chicors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           86400,
	}))

	// Rate limiting
	rateLimiter := middleware.NewRateLimiter(100, time.Minute)
	r.Use(rateLimiter.Limit)

	// Health check
	r.Get("/health", healthHandler.Check)

	// Public API v1
	r.Route("/api/v1", func(r chi.Router) {
		// Auth
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", authHandler.Register)
			r.Post("/login", authHandler.Login)
			r.Post("/refresh", authHandler.Refresh)
			r.Post("/logout", authHandler.Logout)
		})

		// Public yearbook access
		r.Get("/yearbooks", yearbookHandler.List)
		r.Get("/yearbooks/{slug}", yearbookHandler.GetBySlug)
		r.Get("/yearbooks/by-year/{year}", flipbookHandler.GetByYear)
		r.Get("/yearbooks/{id}/pages", yearbookHandler.ListPages)
		r.Get("/yearbooks/{id}/students", yearbookHandler.ListStudents)
		r.Get("/yearbooks/{id}/students/{student_id}", yearbookHandler.GetStudent)

		// Flipbook — public access by year
		r.Get("/flipbook/years", flipbookHandler.ListYears)
		r.Get("/flipbook/{year}", flipbookHandler.GetFlipbookPages)
		r.Get("/flipbook/{year}/students", flipbookHandler.GetStudentsByPage)
		r.Get("/flipbook/asset/{asset_id}", flipbookHandler.ProxyAsset)

		// Search
		r.Get("/search", searchHandler.Search)

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(cfg, logger))

			// Bookmarks
			r.Post("/bookmarks", bookmarkHandler.Create)
			r.Get("/bookmarks", bookmarkHandler.List)
			r.Delete("/bookmarks/{id}", bookmarkHandler.Delete)
		})

		// Admin routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(cfg, logger))
			r.Use(middleware.RequireRole("super_admin", "admin", "editor"))

			// Yearbook management
			r.Post("/admin/yearbooks", yearbookHandler.AdminCreate)
			r.Put("/admin/yearbooks/{id}", yearbookHandler.AdminUpdate)
			r.Delete("/admin/yearbooks/{id}", yearbookHandler.AdminDelete)
			r.Post("/admin/yearbooks/{id}/publish", yearbookHandler.AdminPublish)
			r.Post("/admin/yearbooks/{id}/archive", yearbookHandler.AdminArchive)

			// Student management
			r.Post("/admin/students", yearbookHandler.AdminCreateStudent)
			r.Delete("/admin/students/{student_id}", yearbookHandler.AdminDeleteStudent)

			// Image upload (Immich)
			r.Post("/admin/upload/image", uploadHandler.UploadImage)
			r.Post("/admin/upload/student-photo/{student_id}", uploadHandler.UploadStudentPhoto)
			r.Post("/admin/upload/yearbook-cover/{yearbook_id}", uploadHandler.UploadYearbookCover)

			// Analytics
			r.Get("/admin/analytics", analyticsHandler.Dashboard)
		})
	})

	// Start server
	addr := fmt.Sprintf(":%d", cfg.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh

		logger.Info("shutting down...")
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			logger.Error("shutdown error", "error", err)
		}
	}()

	logger.Info("server starting", "port", cfg.Port, "env", cfg.Environment)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Error("server error", "error", err)
		os.Exit(1)
	}
}
