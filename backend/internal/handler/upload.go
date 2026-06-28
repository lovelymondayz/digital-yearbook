package handler

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/middleware"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/model"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/service"
	"github.com/lovelymondayz/digital-yearbook/backend/pkg/response"
)

type UploadHandler struct {
	immichService *service.ImmichService
}

func NewUploadHandler(immichService *service.ImmichService) *UploadHandler {
	return &UploadHandler{immichService: immichService}
}

type UploadResponse struct {
	AssetID string `json:"asset_id"`
	URL     string `json:"url"`
}

func (h *UploadHandler) UploadImage(w http.ResponseWriter, r *http.Request) {
	// Parse multipart form (32MB max)
	if err := r.ParseMultipartForm(32 << 20); err != nil {
		response.Error(w, model.NewValidationError("failed to parse form (max 32MB)"))
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		response.Error(w, model.NewValidationError("file is required"))
		return
	}
	defer file.Close()

	// Validate file type
	ext := strings.ToLower(filepath.Ext(header.Filename))
	validExts := map[string]string{
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".png":  "image/png",
		".webp": "image/webp",
		".gif":  "image/gif",
	}
	mimeType, valid := validExts[ext]
	if !valid {
		response.Error(w, model.NewValidationError(fmt.Sprintf("unsupported file type: %s", ext)))
		return
	}

	// Validate file size (10MB)
	if header.Size > 10<<20 {
		response.Error(w, model.NewValidationError("file too large (max 10MB)"))
		return
	}

	// Upload to Immich
	result, err := h.immichService.UploadImage(r.Context(), file, header.Filename, mimeType)
	if err != nil {
		response.Error(w, model.NewInternalError())
		return
	}

	assetURL := h.immichService.GetAssetURL(result.ID)

	response.JSON(w, http.StatusCreated, UploadResponse{
		AssetID: result.ID,
		URL:     assetURL,
	})
}

func (h *UploadHandler) UploadStudentPhoto(w http.ResponseWriter, r *http.Request) {
	studentID := chi.URLParam(r, "student_id")
	if studentID == "" {
		response.Error(w, model.NewValidationError("student_id is required"))
		return
	}
	// Reuse generic upload handler logic
	h.UploadImage(w, r)
}

func (h *UploadHandler) UploadYearbookCover(w http.ResponseWriter, r *http.Request) {
	yearbookID := chi.URLParam(r, "yearbook_id")
	if yearbookID == "" {
		response.Error(w, model.NewValidationError("yearbook_id is required"))
		return
	}
	h.UploadImage(w, r)
}

// AdminUploadHandler wraps upload with admin role check
func (h *UploadHandler) AdminRoutes() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.RequireRole("super_admin", "admin", "editor"))
	r.Post("/image", h.UploadImage)
	r.Post("/student-photo/{student_id}", h.UploadStudentPhoto)
	r.Post("/yearbook-cover/{yearbook_id}", h.UploadYearbookCover)
	return r
}
