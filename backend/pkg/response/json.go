package response

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/lovelymondayz/digital-yearbook/backend/internal/model"
)

func JSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		slog.Error("failed to encode JSON response", "error", err)
	}
}

func Error(w http.ResponseWriter, err *model.APIError) {
	code := model.StatusCodeForError(err)
	JSON(w, code, model.ErrorResponse{Error: err})
}

func Paginated(w http.ResponseWriter, status int, data interface{}, pagination *model.Pagination) {
	resp := model.PaginatedResponse{
		Data:       data,
		Pagination: pagination,
	}
	JSON(w, status, resp)
}
