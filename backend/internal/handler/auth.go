package handler

import (
	"encoding/json"
	"net/http"

	"github.com/lovelymondayz/digital-yearbook/backend/internal/model"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/service"
	"github.com/lovelymondayz/digital-yearbook/backend/pkg/response"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req model.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, model.NewValidationError("invalid request body"))
		return
	}

	user, tokens, err := h.authService.Register(r.Context(), req)
	if err != nil {
		response.Error(w, model.NewConflictError(err.Error()))
		return
	}

	response.JSON(w, http.StatusCreated, map[string]interface{}{
		"user":  user,
		"tokens": tokens,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req model.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, model.NewValidationError("invalid request body"))
		return
	}

	user, tokens, err := h.authService.Login(r.Context(), req)
	if err != nil {
		response.Error(w, model.NewUnauthorizedError(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"user":  user,
		"tokens": tokens,
	})
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req model.RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, model.NewValidationError("invalid request body"))
		return
	}

	tokens, err := h.authService.RefreshToken(r.Context(), req.RefreshToken)
	if err != nil {
		response.Error(w, model.NewUnauthorizedError(err.Error()))
		return
	}

	response.JSON(w, http.StatusOK, tokens)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	var req model.RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, model.NewValidationError("invalid request body"))
		return
	}

	if err := h.authService.Logout(r.Context(), req.RefreshToken); err != nil {
		response.Error(w, model.NewInternalError())
		return
	}

	response.JSON(w, http.StatusOK, map[string]string{"message": "logged out"})
}
