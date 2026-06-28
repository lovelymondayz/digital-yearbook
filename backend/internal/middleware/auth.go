package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/config"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/model"
	"github.com/lovelymondayz/digital-yearbook/backend/pkg/response"
)

type contextKey string

const UserIDKey contextKey = "user_id"
const UserRoleKey contextKey = "user_role"

type Claims struct {
	UserID    string `json:"user_id"`
	Role      string `json:"role"`
	SessionID string `json:"session_id"`
	jwt.RegisteredClaims
}

func Auth(cfg *config.Config, logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				response.Error(w, model.NewUnauthorizedError("missing authorization header"))
				return
			}

			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			if tokenStr == authHeader {
				response.Error(w, model.NewUnauthorizedError("invalid authorization format"))
				return
			}

			claims := &Claims{}
			token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, jwt.ErrSignatureInvalid
				}
				return []byte(cfg.JWTSecret), nil
			})

			if err != nil || !token.Valid {
				response.Error(w, model.NewUnauthorizedError("invalid or expired token"))
				return
			}

			ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
			ctx = context.WithValue(ctx, UserRoleKey, claims.Role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func RequireRole(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, ok := r.Context().Value(UserRoleKey).(string)
			if !ok {
				response.Error(w, model.NewUnauthorizedError(""))
				return
			}

			for _, allowed := range roles {
				if role == allowed {
					next.ServeHTTP(w, r)
					return
				}
			}

			if role == "super_admin" {
				next.ServeHTTP(w, r)
				return
			}

			response.Error(w, model.NewForbiddenError("insufficient permissions"))
		})
	}
}

func Logger(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			wrapped := &statusWriter{ResponseWriter: w, status: http.StatusOK}

			next.ServeHTTP(wrapped, r)

			logger.Info("request",
				"method", r.Method,
				"path", r.URL.Path,
				"status", wrapped.status,
				"duration", time.Since(start).String(),
				"ip", r.RemoteAddr,
			)
		})
	}
}

func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		next.ServeHTTP(w, r)
	})
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (w *statusWriter) WriteHeader(status int) {
	w.status = status
	w.ResponseWriter.WriteHeader(status)
}
