package handler

import (
	"net/http"

	"github.com/lovelymondayz/digital-yearbook/backend/internal/model"
	"github.com/lovelymondayz/digital-yearbook/backend/pkg/response"
)

type BookmarkHandler struct{}

func NewBookmarkHandler() *BookmarkHandler {
	return &BookmarkHandler{}
}

func (h *BookmarkHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req model.Bookmark
	if err := readJSON(r, &req); err != nil {
		response.Error(w, model.NewValidationError("invalid request body"))
		return
	}
	// TODO: Implement bookmark creation
	response.JSON(w, http.StatusCreated, req)
}

func (h *BookmarkHandler) List(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement bookmark listing
	response.JSON(w, http.StatusOK, []model.Bookmark{})
}

func (h *BookmarkHandler) Delete(w http.ResponseWriter, r *http.Request) {
	// TODO: Implement bookmark deletion
	response.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func readJSON(r *http.Request, v interface{}) error {
	return nil // placeholder
}
