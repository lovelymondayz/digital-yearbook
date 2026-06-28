package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/lovelymondayz/digital-yearbook/backend/internal/middleware"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/model"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/service"
	"github.com/lovelymondayz/digital-yearbook/backend/pkg/response"
)

type YearbookHandler struct {
	yearbookService *service.YearbookService
}

func NewYearbookHandler(yearbookService *service.YearbookService) *YearbookHandler {
	return &YearbookHandler{yearbookService: yearbookService}
}

func (h *YearbookHandler) List(w http.ResponseWriter, r *http.Request) {
	universityID := r.URL.Query().Get("university_id")
	yearbooks, err := h.yearbookService.ListPublished(r.Context(), universityID)
	if err != nil {
		response.Error(w, model.NewInternalError())
		return
	}
	response.JSON(w, http.StatusOK, yearbooks)
}

func (h *YearbookHandler) GetBySlug(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if slug == "" {
		response.Error(w, model.NewValidationError("slug is required"))
		return
	}

	yb, err := h.yearbookService.GetBySlug(r.Context(), slug)
	if err != nil {
		response.Error(w, model.NewNotFoundError("yearbook"))
		return
	}
	response.JSON(w, http.StatusOK, yb)
}

func (h *YearbookHandler) ListPages(w http.ResponseWriter, r *http.Request) {
	yearbookID := r.PathValue("id")
	if yearbookID == "" {
		response.Error(w, model.NewValidationError("yearbook id is required"))
		return
	}

	pages, err := h.yearbookService.ListPages(r.Context(), yearbookID)
	if err != nil {
		response.Error(w, model.NewInternalError())
		return
	}
	response.JSON(w, http.StatusOK, pages)
}

func (h *YearbookHandler) ListStudents(w http.ResponseWriter, r *http.Request) {
	yearbookID := r.PathValue("id")
	if yearbookID == "" {
		response.Error(w, model.NewValidationError("yearbook id is required"))
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	offset, _ := strconv.Atoi(r.URL.Query().Get("offset"))

	students, total, err := h.yearbookService.GetStudents(r.Context(), yearbookID, limit, offset)
	if err != nil {
		response.Error(w, model.NewInternalError())
		return
	}

	response.Paginated(w, http.StatusOK, students, &model.Pagination{
		Limit:   limit,
		HasMore: offset+limit < total,
	})
}

func (h *YearbookHandler) GetStudent(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("student_id")
	if id == "" {
		response.Error(w, model.NewValidationError("student id is required"))
		return
	}

	student, err := h.yearbookService.GetStudentByID(r.Context(), id)
	if err != nil {
		response.Error(w, model.NewNotFoundError("student"))
		return
	}
	response.JSON(w, http.StatusOK, student)
}

// Admin handlers

func (h *YearbookHandler) AdminCreate(w http.ResponseWriter, r *http.Request) {
	var req model.CreateYearbookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, model.NewValidationError("invalid request body"))
		return
	}

	userID, _ := r.Context().Value(middleware.UserIDKey).(string)
	yb, err := h.yearbookService.Create(r.Context(), req, userID)
	if err != nil {
		response.Error(w, model.NewInternalError())
		return
	}
	response.JSON(w, http.StatusCreated, yb)
}

func (h *YearbookHandler) AdminUpdate(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		response.Error(w, model.NewValidationError("id is required"))
		return
	}

	var req model.UpdateYearbookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, model.NewValidationError("invalid request body"))
		return
	}

	yb, err := h.yearbookService.Update(r.Context(), id, req)
	if err != nil {
		response.Error(w, model.NewInternalError())
		return
	}
	response.JSON(w, http.StatusOK, yb)
}

func (h *YearbookHandler) AdminDelete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		response.Error(w, model.NewValidationError("id is required"))
		return
	}

	if err := h.yearbookService.SoftDelete(r.Context(), id); err != nil {
		response.Error(w, model.NewInternalError())
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *YearbookHandler) AdminPublish(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.yearbookService.Publish(r.Context(), id); err != nil {
		response.Error(w, model.NewInternalError())
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "published"})
}

func (h *YearbookHandler) AdminArchive(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.yearbookService.Archive(r.Context(), id); err != nil {
		response.Error(w, model.NewInternalError())
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "archived"})
}

func (h *YearbookHandler) AdminCreateStudent(w http.ResponseWriter, r *http.Request) {
	var req model.CreateStudentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, model.NewValidationError("invalid request body"))
		return
	}

	student, err := h.yearbookService.CreateStudent(r.Context(), req)
	if err != nil {
		response.Error(w, model.NewInternalError())
		return
	}
	response.JSON(w, http.StatusCreated, student)
}

func (h *YearbookHandler) AdminDeleteStudent(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("student_id")
	if err := h.yearbookService.SoftDeleteStudent(r.Context(), id); err != nil {
		response.Error(w, model.NewInternalError())
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}
