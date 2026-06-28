package handler

import (
	"fmt"
	"io"
	"net/http"
	"sort"
	"strconv"

	"github.com/lovelymondayz/digital-yearbook/backend/internal/model"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/service"
	"github.com/lovelymondayz/digital-yearbook/backend/pkg/response"
)

type FlipbookHandler struct {
	yearbookService *service.YearbookService
	immichService   *service.ImmichService
}

func NewFlipbookHandler(yearbookService *service.YearbookService, immichService *service.ImmichService) *FlipbookHandler {
	return &FlipbookHandler{
		yearbookService: yearbookService,
		immichService:   immichService,
	}
}

// FlipbookPage represents a single page in the flipbook.
type FlipbookPage struct {
	PageNumber int    `json:"page_number"`
	ImageURL   string `json:"image_url"`
	Width      int    `json:"width,omitempty"`
	Height     int    `json:"height,omitempty"`
}

// FlipbookData represents the full flipbook for a year.
type FlipbookData struct {
	YearbookID string          `json:"yearbook_id"`
	Year       int             `json:"year"`
	Title      string          `json:"title"`
	Pages      []FlipbookPage  `json:"pages"`
}

// ListYears returns all available yearbook years with thumbnails from Immich albums.
func (h *FlipbookHandler) ListYears(w http.ResponseWriter, r *http.Request) {
	years, err := h.immichService.ListYearbookYears(r.Context())
	if err != nil {
		response.JSON(w, http.StatusOK, []service.YearbookYearInfo{})
		return
	}
	response.JSON(w, http.StatusOK, years)
}
func (h *FlipbookHandler) GetByYear(w http.ResponseWriter, r *http.Request) {
	yearStr := r.PathValue("year")
	if yearStr == "" {
		response.Error(w, model.NewValidationError("year is required"))
		return
	}

	year, err := strconv.Atoi(yearStr)
	if err != nil || year < 2000 || year > 2100 {
		response.Error(w, model.NewValidationError("invalid year"))
		return
	}

	yb, err := h.yearbookService.GetByYear(r.Context(), year)
	if err != nil {
		response.Error(w, model.NewNotFoundError("yearbook"))
		return
	}

	response.JSON(w, http.StatusOK, yb)
}

// GetFlipbookPages returns the flipbook pages for a yearbook by year.
// It looks up the Immich album "Thamrin Graduate {year}" and returns all image URLs.
func (h *FlipbookHandler) GetFlipbookPages(w http.ResponseWriter, r *http.Request) {
	yearStr := r.PathValue("year")
	if yearStr == "" {
		response.Error(w, model.NewValidationError("year is required"))
		return
	}

	year, err := strconv.Atoi(yearStr)
	if err != nil || year < 2000 || year > 2100 {
		response.Error(w, model.NewValidationError("invalid year"))
		return
	}

	// Find the Immich album for this year
	albumName := fmt.Sprintf("Thamrin Graduate %d", year)
	album, err := h.immichService.GetAlbumByName(r.Context(), albumName)
	if err != nil {
		// Return empty pages if album not found
		response.JSON(w, http.StatusOK, FlipbookData{
			Year:  year,
			Title: albumName,
			Pages: []FlipbookPage{},
		})
		return
	}

	// Get all assets in the album
	assets, err := h.immichService.GetAlbumAssets(r.Context(), album.ID)
	if err != nil {
		response.Error(w, model.NewInternalError())
		return
	}

	// Sort assets by original filename for correct page order
	sort.Slice(assets, func(i, j int) bool {
		return assets[i].OriginalFileName < assets[j].OriginalFileName
	})

	// Build flipbook pages — use proxy URLs so the browser can access Immich images
	pages := make([]FlipbookPage, 0, len(assets))
	for i, asset := range assets {
		pages = append(pages, FlipbookPage{
			PageNumber: i + 1,
			ImageURL:   fmt.Sprintf("/api/v1/flipbook/asset/%s", asset.ID),
			Width:      asset.Width,
			Height:     asset.Height,
		})
	}

	response.JSON(w, http.StatusOK, FlipbookData{
		YearbookID: album.ID,
		Year:       year,
		Title:      albumName,
		Pages:      pages,
	})
}

// GetStudentsByPage returns all students for a yearbook grouped by page number.
// This powers the right sidebar in the flipbook view.
func (h *FlipbookHandler) GetStudentsByPage(w http.ResponseWriter, r *http.Request) {
	yearStr := r.PathValue("year")
	if yearStr == "" {
		response.Error(w, model.NewValidationError("year is required"))
		return
	}

	year, err := strconv.Atoi(yearStr)
	if err != nil || year < 2000 || year > 2100 {
		response.Error(w, model.NewValidationError("invalid year"))
		return
	}

	// Find the yearbook by year
	yb, err := h.yearbookService.GetByYear(r.Context(), year)
	if err != nil {
		response.Error(w, model.NewNotFoundError("yearbook"))
		return
	}

	// Get all students for this yearbook (no pagination — we need all for the sidebar)
	students, _, err := h.yearbookService.GetStudents(r.Context(), yb.ID, 10000, 0)
	if err != nil {
		response.Error(w, model.NewInternalError())
		return
	}

	// Group students by page number
	// pageStudents[pageNumber] = []StudentSummary
	type StudentSummary struct {
		ID        string  `json:"id"`
		FullName  string  `json:"full_name"`
		AvatarURL *string `json:"avatar_image_url,omitempty"`
		Major     *string `json:"major,omitempty"`
	}

	pageStudents := make(map[int][]StudentSummary)
	for _, s := range students {
		if s.PageNumber != nil && *s.PageNumber > 0 {
			pageStudents[*s.PageNumber] = append(pageStudents[*s.PageNumber], StudentSummary{
				ID:        s.ID,
				FullName:  s.FullName,
				AvatarURL: s.AvatarImageURL,
				Major:     s.Major,
			})
		}
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"yearbook_id":   yb.ID,
		"year":          year,
		"page_students": pageStudents,
	})
}
func (h *FlipbookHandler) ProxyAsset(w http.ResponseWriter, r *http.Request) {
	assetID := r.PathValue("asset_id")
	if assetID == "" {
		response.Error(w, model.NewValidationError("asset_id is required"))
		return
	}

	// Fetch the image from Immich
	immichURL := h.immichService.GetAssetURL(assetID)
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, immichURL, nil)
	if err != nil {
		response.Error(w, model.NewInternalError())
		return
	}
	req.Header.Set("x-api-key", h.immichService.APIKey())

	resp, err := h.immichService.HTTPClient().Do(req)
	if err != nil {
		response.Error(w, model.NewInternalError())
		return
	}
	defer resp.Body.Close()

	// Copy headers (skip hop-by-hop)
	skipHeaders := map[string]bool{"Transfer-Encoding": true, "Connection": true}
	for key, values := range resp.Header {
		if skipHeaders[key] {
			continue
		}
		for _, v := range values {
			w.Header().Add(key, v)
		}
	}
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}
