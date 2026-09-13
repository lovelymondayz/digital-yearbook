package handler

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/model"
	"github.com/lovelymondayz/digital-yearbook/backend/pkg/response"
)

type AnalyticsHandler struct {
	db *pgxpool.Pool
}

func NewAnalyticsHandler(db *pgxpool.Pool) *AnalyticsHandler {
	return &AnalyticsHandler{db: db}
}

func (h *AnalyticsHandler) Dashboard(w http.ResponseWriter, r *http.Request) {
	dashboard := model.AnalyticsDashboard{
		RecentActivity: []model.AuditLog{},
	}

	// Total universities
	_ = h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM universities WHERE deleted_at IS NULL`).Scan(&dashboard.TotalUniversities)
	// Total yearbooks
	_ = h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM yearbooks WHERE deleted_at IS NULL`).Scan(&dashboard.TotalYearbooks)
	// Total students
	_ = h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM students WHERE deleted_at IS NULL`).Scan(&dashboard.TotalStudents)
	// Total page views
	_ = h.db.QueryRow(r.Context(), `SELECT COUNT(*) FROM analytics_events WHERE deleted_at IS NULL`).Scan(&dashboard.TotalPageViews)

	response.JSON(w, http.StatusOK, dashboard)
}
