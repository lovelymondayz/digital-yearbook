package handler

import (
	"net/http"

	"github.com/lovelymondayz/digital-yearbook/backend/internal/config"
	"github.com/lovelymondayz/digital-yearbook/backend/pkg/response"
)

type HealthHandler struct {
	cfg *config.Config
}

func NewHealthHandler(cfg *config.Config) *HealthHandler {
	return &HealthHandler{cfg: cfg}
}

func (h *HealthHandler) Check(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]interface{}{
		"status":  "ok",
		"version": "1.0.0",
		"env":     h.cfg.Environment,
	})
}
