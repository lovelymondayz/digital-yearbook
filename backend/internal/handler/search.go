package handler

import (
	"net/http"
	"strconv"

	"github.com/lovelymondayz/digital-yearbook/backend/internal/model"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/service"
	"github.com/lovelymondayz/digital-yearbook/backend/pkg/response"
)

type SearchHandler struct {
	searchService *service.SearchService
}

func NewSearchHandler(searchService *service.SearchService) *SearchHandler {
	return &SearchHandler{searchService: searchService}
}

func (h *SearchHandler) Search(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("q")
	yearStr := r.URL.Query().Get("year")
	department := r.URL.Query().Get("department")
	faculty := r.URL.Query().Get("faculty")
	yearbookID := r.URL.Query().Get("yearbook_id")

	filters := service.SearchFilters{
		Query:      query,
		Department: department,
		Faculty:    faculty,
		YearbookID: yearbookID,
		Limit:      20,
	}

	if yearStr != "" {
		if year, err := strconv.Atoi(yearStr); err == nil {
			filters.Year = year
		}
	}

	result, err := h.searchService.SearchStudents(r.Context(), query, filters)
	if err != nil {
		response.Error(w, model.NewInternalError())
		return
	}

	response.JSON(w, http.StatusOK, result)
}
