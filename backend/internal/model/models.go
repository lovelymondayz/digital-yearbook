package model

import "time"

// Standard API error response
type APIError struct {
	Code    string   `json:"code"`
	Message string   `json:"message"`
	Details []string `json:"details,omitempty"`
}

func (e *APIError) Error() string { return e.Message }

type ErrorResponse struct {
	Error *APIError `json:"error"`
}

// Pagination
type Pagination struct {
	Cursor string `json:"cursor,omitempty"`
	Limit  int    `json:"limit"`
	HasMore bool  `json:"has_more"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Pagination *Pagination `json:"pagination,omitempty"`
}

// University
type University struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Slug         string    `json:"slug"`
	Subdomain    string    `json:"subdomain"`
	LogoURL      *string   `json:"logo_url,omitempty"`
	PrimaryColor string    `json:"primary_color"`
	Settings     JSONB     `json:"settings"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// Yearbook
type Yearbook struct {
	ID            string    `json:"id"`
	UniversityID  string    `json:"university_id"`
	CampusID      *string   `json:"campus_id,omitempty"`
	Year          int       `json:"year"`
	Title         string    `json:"title"`
	Slug          string    `json:"slug"`
	CoverImageURL *string   `json:"cover_image_url,omitempty"`
	Description   *string   `json:"description,omitempty"`
	Status        string    `json:"status"`
	PublishedAt   *time.Time `json:"published_at,omitempty"`
	Settings      JSONB     `json:"settings"`
	Theme         JSONB     `json:"theme"`
	Version       int       `json:"version"`
	CreatedBy     *string   `json:"created_by,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// Student
type Student struct {
	ID             string    `json:"id"`
	YearbookID     string    `json:"yearbook_id"`
	DepartmentID   *string   `json:"department_id,omitempty"`
	FullName       string    `json:"full_name"`
	StudentID      *string   `json:"student_id,omitempty"`
	Email          *string   `json:"email,omitempty"`
	Phone          *string   `json:"phone,omitempty"`
	Quote          *string   `json:"quote,omitempty"`
	AvatarImageURL *string   `json:"avatar_image_url,omitempty"`
	Major          *string   `json:"major,omitempty"`
	Minor          *string   `json:"minor,omitempty"`
	GraduationYear *int      `json:"graduation_year,omitempty"`
	HonorsAwards   JSONB     `json:"honors_awards"`
	SocialLinks    JSONB     `json:"social_links"`
	CustomDesign   JSONB     `json:"custom_design"`
	PageNumber     *int      `json:"page_number,omitempty"`
	IsPublished    bool      `json:"is_published"`
	Metadata       JSONB     `json:"metadata"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// YearbookPage
type YearbookPage struct {
	ID           string    `json:"id"`
	YearbookID   string    `json:"yearbook_id"`
	PageNumber   int       `json:"page_number"`
	Title        *string   `json:"title,omitempty"`
	LayoutType   string    `json:"layout_type"`
	Content      JSONB     `json:"content"`
	ThumbnailURL *string   `json:"thumbnail_url,omitempty"`
	SortOrder    int       `json:"sort_order"`
	IsPremium    bool      `json:"is_premium"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// User
type User struct {
	ID           string     `json:"id"`
	UniversityID *string    `json:"university_id,omitempty"`
	Email        string     `json:"email"`
	FullName     string     `json:"full_name"`
	Role         string     `json:"role"`
	Status       string     `json:"status"`
	LastLoginAt  *time.Time `json:"last_login_at,omitempty"`
	AvatarURL    *string    `json:"avatar_url,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// Session
type Session struct {
	ID               string    `json:"id"`
	UserID           string    `json:"user_id"`
	ExpiresAt        time.Time `json:"expires_at"`
	RefreshExpiresAt time.Time `json:"refresh_expires_at"`
	IsRevoked        bool      `json:"is_revoked"`
	CreatedAt        time.Time `json:"created_at"`
}

// AuditLog
type AuditLog struct {
	ID         string    `json:"id"`
	UserID     *string   `json:"user_id,omitempty"`
	Action     string    `json:"action"`
	EntityType string    `json:"entity_type"`
	EntityID   *string   `json:"entity_id,omitempty"`
	OldValues  JSONB     `json:"old_values,omitempty"`
	NewValues  JSONB     `json:"new_values,omitempty"`
	IPAddress  *string   `json:"ip_address,omitempty"`
	UserAgent  *string   `json:"user_agent,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

// Bookmark
type Bookmark struct {
	ID             string    `json:"id"`
	UserID         string    `json:"user_id"`
	YearbookID     string    `json:"yearbook_id"`
	YearbookPageID *string   `json:"yearbook_page_id,omitempty"`
	StudentID      *string   `json:"student_id,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
}

// ImageAsset
type ImageAsset struct {
	ID           string    `json:"id"`
	UniversityID *string   `json:"university_id,omitempty"`
	YearbookID   *string   `json:"yearbook_id,omitempty"`
	FileName     string    `json:"file_name"`
	OriginalURL  string    `json:"original_url"`
	OptimizedURL *string   `json:"optimized_url,omitempty"`
	ThumbnailURL *string   `json:"thumbnail_url,omitempty"`
	WebpURL      *string   `json:"webp_url,omitempty"`
	FileSize     *int64    `json:"file_size,omitempty"`
	MimeType     *string   `json:"mime_type,omitempty"`
	Width        *int      `json:"width,omitempty"`
	Height       *int      `json:"height,omitempty"`
	AltText      *string   `json:"alt_text,omitempty"`
	Metadata     JSONB     `json:"metadata"`
	UploadedBy   *string   `json:"uploaded_by,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// JSONB is a generic JSON object for PostgreSQL JSONB columns
type JSONB map[string]interface{}

// SearchResult
type SearchResult struct {
	Students []Student `json:"students"`
	Total    int       `json:"total"`
}

// TokenPair for auth responses
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"` // seconds
	TokenType    string `json:"token_type"`
}

// LoginRequest
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

// RegisterRequest
type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	FullName string `json:"full_name" validate:"required,min=2"`
}

// RefreshRequest
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// CreateYearbookRequest
type CreateYearbookRequest struct {
	UniversityID  string `json:"university_id" validate:"required"`
	CampusID      string `json:"campus_id,omitempty"`
	Year          int    `json:"year" validate:"required,min=2000,max=2100"`
	Title         string `json:"title" validate:"required,min=3"`
	Description   string `json:"description,omitempty"`
}

// UpdateYearbookRequest
type UpdateYearbookRequest struct {
	Title       string `json:"title,omitempty"`
	Description string `json:"description,omitempty"`
	CoverImageURL string `json:"cover_image_url,omitempty"`
	Settings    JSONB  `json:"settings,omitempty"`
	Theme       JSONB  `json:"theme,omitempty"`
}

// CreateStudentRequest
type CreateStudentRequest struct {
	YearbookID     string `json:"yearbook_id" validate:"required"`
	DepartmentID   string `json:"department_id,omitempty"`
	FullName       string `json:"full_name" validate:"required"`
	StudentID      string `json:"student_id,omitempty"`
	Email          string `json:"email,omitempty"`
	Phone          string `json:"phone,omitempty"`
	Quote          string `json:"quote,omitempty"`
	AvatarImageURL string `json:"avatar_image_url,omitempty"`
	Major          string `json:"major,omitempty"`
	Minor          string `json:"minor,omitempty"`
	GraduationYear int    `json:"graduation_year,omitempty"`
	PageNumber     int    `json:"page_number,omitempty"`
}

// Analytics dashboard
type AnalyticsDashboard struct {
	TotalUniversities int `json:"total_universities"`
	TotalYearbooks    int `json:"total_yearbooks"`
	TotalStudents     int `json:"total_students"`
	TotalPageViews    int `json:"total_page_views"`
	RecentActivity    []AuditLog `json:"recent_activity"`
}
