package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"sort"
	"time"
)

type ImmichService struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

func NewImmichService(baseURL, apiKey string) *ImmichService {
	return &ImmichService{
		baseURL: baseURL,
		apiKey:  apiKey,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

type ImmichUploadResponse struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

// UploadImage uploads a file to Immich and returns the asset ID and public URL.
func (s *ImmichService) UploadImage(ctx context.Context, file multipart.File, fileName, mimeType string) (*ImmichUploadResponse, error) {
	// Read file into buffer
	buf := new(bytes.Buffer)
	if _, err := io.Copy(buf, file); err != nil {
		return nil, fmt.Errorf("read file: %w", err)
	}

	// Build multipart request
	body := new(bytes.Buffer)
	writer := multipart.NewWriter(body)

	// Required fields for Immich upload
	_ = writer.WriteField("deviceAssetId", fmt.Sprintf("yearbook-%d", time.Now().UnixNano()))
	_ = writer.WriteField("deviceId", "digital-yearbook")
	_ = writer.WriteField("fileCreatedAt", time.Now().UTC().Format(time.RFC3339))
	_ = writer.WriteField("fileModifiedAt", time.Now().UTC().Format(time.RFC3339))

	// File part
	part, err := writer.CreateFormFile("assetData", fileName)
	if err != nil {
		return nil, fmt.Errorf("create form file: %w", err)
	}
	if _, err := part.Write(buf.Bytes()); err != nil {
		return nil, fmt.Errorf("write file data: %w", err)
	}
	writer.Close()

	// Create request
	url := fmt.Sprintf("%s/api/assets", s.baseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, body)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("x-api-key", s.apiKey)

	// Execute
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("immich upload failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("immich upload error (status %d): %s", resp.StatusCode, string(respBody))
	}

	// Parse response - Immich returns {id, status}
	var result ImmichUploadResponse
	if err := json.Unmarshal(respBody, &result); err != nil {
		// If JSON parse fails, try to extract ID from raw response
		result.ID = string(respBody)
		result.Status = "created"
	}

	return &result, nil
}

// GetAssetURL constructs the public URL for an Immich asset.
func (s *ImmichService) GetAssetURL(assetID string) string {
	return fmt.Sprintf("%s/api/assets/%s/original", s.baseURL, assetID)
}

// GetAssetThumbnailURL constructs the thumbnail URL for an Immich asset.
func (s *ImmichService) GetAssetThumbnailURL(assetID string) string {
	return fmt.Sprintf("%s/api/assets/%s/thumbnail?size=preview", s.baseURL, assetID)
}

// HTTPClient returns the HTTP client for making requests to Immich.
func (s *ImmichService) HTTPClient() *http.Client {
	return s.httpClient
}

// APIKey returns the Immich API key.
func (s *ImmichService) APIKey() string {
	return s.apiKey
}

// ListYearbookYears scans Immich albums for "Thamrin Graduate {year}" and returns year info with thumbnails.
type YearbookYearInfo struct {
	Year      int    `json:"year"`
	Title     string `json:"title"`
	PageCount int    `json:"page_count"`
	ThumbURL  string `json:"thumb_url"`
}

func (s *ImmichService) ListYearbookYears(ctx context.Context) ([]YearbookYearInfo, error) {
	albums, err := s.ListAlbums(ctx)
	if err != nil {
		return nil, err
	}

	var years []YearbookYearInfo
	for _, a := range albums {
		// Match albums named "Thamrin Graduate {year}"
		var year int
		_, err := fmt.Sscanf(a.AlbumName, "Thamrin Graduate %d", &year)
		if err != nil || year < 2000 || year > 2100 {
			continue
		}

		thumbURL := ""
		if a.AlbumThumbnailAssetID != "" {
			thumbURL = fmt.Sprintf("/api/v1/flipbook/asset/%s", a.AlbumThumbnailAssetID)
		}

		years = append(years, YearbookYearInfo{
			Year:      year,
			Title:     a.AlbumName,
			PageCount: a.AssetCount,
			ThumbURL:  thumbURL,
		})
	}

	// Sort descending (newest first)
	sort.Slice(years, func(i, j int) bool {
		return years[i].Year > years[j].Year
	})

	return years, nil
}

// ImmichAlbum represents an Immich album.
type ImmichAlbum struct {
	ID               string `json:"id"`
	AlbumName        string `json:"albumName"`
	Description      string `json:"description"`
	AlbumThumbnailAssetID string `json:"albumThumbnailAssetId"`
	AssetCount       int    `json:"assetCount"`
}

// ImmichAsset represents an Immich asset (image).
type ImmichAsset struct {
	ID               string `json:"id"`
	OriginalFileName string `json:"originalFileName"`
	OriginalMimeType string `json:"originalMimeType"`
	Width            int    `json:"width"`
	Height           int    `json:"height"`
}

// ListAlbums returns all albums from Immich.
func (s *ImmichService) ListAlbums(ctx context.Context) ([]ImmichAlbum, error) {
	url := fmt.Sprintf("%s/api/albums", s.baseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("x-api-key", s.apiKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("list albums failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("list albums error (status %d): %s", resp.StatusCode, string(body))
	}

	var albums []ImmichAlbum
	if err := json.Unmarshal(body, &albums); err != nil {
		return nil, fmt.Errorf("parse albums: %w", err)
	}
	return albums, nil
}

// GetAlbumByName finds an album by name.
func (s *ImmichService) GetAlbumByName(ctx context.Context, name string) (*ImmichAlbum, error) {
	albums, err := s.ListAlbums(ctx)
	if err != nil {
		return nil, err
	}
	for _, a := range albums {
		if a.AlbumName == name {
			return &a, nil
		}
	}
	return nil, fmt.Errorf("album not found: %s", name)
}

// GetAlbumAssets returns all assets in an album.
func (s *ImmichService) GetAlbumAssets(ctx context.Context, albumID string) ([]ImmichAsset, error) {
	url := fmt.Sprintf("%s/api/albums/%s", s.baseURL, albumID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("x-api-key", s.apiKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("get album failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("get album error (status %d): %s", resp.StatusCode, string(body))
	}

	var result struct {
		Assets []ImmichAsset `json:"assets"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("parse album assets: %w", err)
	}
	return result.Assets, nil
}
