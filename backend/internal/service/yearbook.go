package service

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/model"
)

type YearbookService struct {
	db *pgxpool.Pool
}

func NewYearbookService(db *pgxpool.Pool) *YearbookService {
	return &YearbookService{db: db}
}

func (s *YearbookService) Create(ctx context.Context, req model.CreateYearbookRequest, createdBy string) (*model.Yearbook, error) {
	slug := fmt.Sprintf("%d-%s", req.Year, req.Title)
	var yb model.Yearbook
	err := s.db.QueryRow(ctx, `
		INSERT INTO yearbooks (university_id, campus_id, year, title, slug, description, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, university_id, campus_id, year, title, slug, cover_image_url, description,
		          status, published_at, settings, theme, version, created_by, created_at, updated_at
	`, req.UniversityID, req.CampusID, req.Year, req.Title, slug, req.Description, createdBy).Scan(
		&yb.ID, &yb.UniversityID, &yb.CampusID, &yb.Year, &yb.Title, &yb.Slug,
		&yb.CoverImageURL, &yb.Description, &yb.Status, &yb.PublishedAt,
		&yb.Settings, &yb.Theme, &yb.Version, &yb.CreatedBy, &yb.CreatedAt, &yb.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create yearbook: %w", err)
	}
	return &yb, nil
}

func (s *YearbookService) GetBySlug(ctx context.Context, slug string) (*model.Yearbook, error) {
	var yb model.Yearbook
	err := s.db.QueryRow(ctx, `
		SELECT id, university_id, campus_id, year, title, slug, cover_image_url, description,
		       status, published_at, settings, theme, version, created_by, created_at, updated_at
		FROM yearbooks WHERE slug = $1 AND deleted_at IS NULL
	`, slug).Scan(
		&yb.ID, &yb.UniversityID, &yb.CampusID, &yb.Year, &yb.Title, &yb.Slug,
		&yb.CoverImageURL, &yb.Description, &yb.Status, &yb.PublishedAt,
		&yb.Settings, &yb.Theme, &yb.Version, &yb.CreatedBy, &yb.CreatedAt, &yb.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("yearbook not found")
	}
	return &yb, nil
}

func (s *YearbookService) GetByID(ctx context.Context, id string) (*model.Yearbook, error) {
	var yb model.Yearbook
	err := s.db.QueryRow(ctx, `
		SELECT id, university_id, campus_id, year, title, slug, cover_image_url, description,
		       status, published_at, settings, theme, version, created_by, created_at, updated_at
		FROM yearbooks WHERE id = $1 AND deleted_at IS NULL
	`, id).Scan(
		&yb.ID, &yb.UniversityID, &yb.CampusID, &yb.Year, &yb.Title, &yb.Slug,
		&yb.CoverImageURL, &yb.Description, &yb.Status, &yb.PublishedAt,
		&yb.Settings, &yb.Theme, &yb.Version, &yb.CreatedBy, &yb.CreatedAt, &yb.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("yearbook not found")
	}
	return &yb, nil
}

// GetByYear finds a published yearbook by year number.
func (s *YearbookService) GetByYear(ctx context.Context, year int) (*model.Yearbook, error) {
	var yb model.Yearbook
	err := s.db.QueryRow(ctx, `
		SELECT id, university_id, campus_id, year, title, slug, cover_image_url, description,
		       status, published_at, settings, theme, version, created_by, created_at, updated_at
		FROM yearbooks WHERE year = $1 AND status = 'published' AND deleted_at IS NULL
		LIMIT 1
	`, year).Scan(
		&yb.ID, &yb.UniversityID, &yb.CampusID, &yb.Year, &yb.Title, &yb.Slug,
		&yb.CoverImageURL, &yb.Description, &yb.Status, &yb.PublishedAt,
		&yb.Settings, &yb.Theme, &yb.Version, &yb.CreatedBy, &yb.CreatedAt, &yb.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("yearbook not found for year %d", year)
	}
	return &yb, nil
}

func (s *YearbookService) ListPublished(ctx context.Context, universityID string) ([]model.Yearbook, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, university_id, campus_id, year, title, slug, cover_image_url, description,
		       status, published_at, settings, theme, version, created_by, created_at, updated_at
		FROM yearbooks
		WHERE status = 'published' AND deleted_at IS NULL
		AND ($1::uuid IS NULL OR university_id = $1)
		ORDER BY year DESC
	`, universityID)
	if err != nil {
		return nil, fmt.Errorf("list yearbooks: %w", err)
	}
	defer rows.Close()

	yearbooks := make([]model.Yearbook, 0)
	for rows.Next() {
		var yb model.Yearbook
		if err := rows.Scan(
			&yb.ID, &yb.UniversityID, &yb.CampusID, &yb.Year, &yb.Title, &yb.Slug,
			&yb.CoverImageURL, &yb.Description, &yb.Status, &yb.PublishedAt,
			&yb.Settings, &yb.Theme, &yb.Version, &yb.CreatedBy, &yb.CreatedAt, &yb.UpdatedAt,
		); err != nil {
			return nil, err
		}
		yearbooks = append(yearbooks, yb)
	}
	return yearbooks, nil
}

func (s *YearbookService) Update(ctx context.Context, id string, req model.UpdateYearbookRequest) (*model.Yearbook, error) {
	query := `UPDATE yearbooks SET updated_at = NOW(), version = version + 1`
	args := []interface{}{}
	argIdx := 1

	if req.Title != "" {
		query += fmt.Sprintf(", title = $%d", argIdx)
		args = append(args, req.Title)
		argIdx++
	}
	if req.Description != "" {
		query += fmt.Sprintf(", description = $%d", argIdx)
		args = append(args, req.Description)
		argIdx++
	}
	if req.CoverImageURL != "" {
		query += fmt.Sprintf(", cover_image_url = $%d", argIdx)
		args = append(args, req.CoverImageURL)
		argIdx++
	}

	query += fmt.Sprintf(" WHERE id = $%d AND deleted_at IS NULL RETURNING id, university_id, campus_id, year, title, slug, cover_image_url, description, status, published_at, settings, theme, version, created_by, created_at, updated_at", argIdx)
	args = append(args, id)

	var yb model.Yearbook
	err := s.db.QueryRow(ctx, query, args...).Scan(
		&yb.ID, &yb.UniversityID, &yb.CampusID, &yb.Year, &yb.Title, &yb.Slug,
		&yb.CoverImageURL, &yb.Description, &yb.Status, &yb.PublishedAt,
		&yb.Settings, &yb.Theme, &yb.Version, &yb.CreatedBy, &yb.CreatedAt, &yb.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("update yearbook: %w", err)
	}
	return &yb, nil
}

func (s *YearbookService) Publish(ctx context.Context, id string) error {
	_, err := s.db.Exec(ctx, `
		UPDATE yearbooks SET status = 'published', published_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND status = 'draft' AND deleted_at IS NULL
	`, id)
	return err
}

func (s *YearbookService) Archive(ctx context.Context, id string) error {
	_, err := s.db.Exec(ctx, `
		UPDATE yearbooks SET status = 'archived', updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
	`, id)
	return err
}

func (s *YearbookService) SoftDelete(ctx context.Context, id string) error {
	_, err := s.db.Exec(ctx, `
		UPDATE yearbooks SET deleted_at = NOW(), updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
	`, id)
	return err
}

func (s *YearbookService) ListPages(ctx context.Context, yearbookID string) ([]model.YearbookPage, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, yearbook_id, page_number, title, layout_type, content, thumbnail_url, sort_order, is_premium, created_at, updated_at
		FROM yearbook_pages
		WHERE yearbook_id = $1 AND deleted_at IS NULL
		ORDER BY sort_order ASC, page_number ASC
	`, yearbookID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	pages := make([]model.YearbookPage, 0)
	for rows.Next() {
		var p model.YearbookPage
		if err := rows.Scan(&p.ID, &p.YearbookID, &p.PageNumber, &p.Title, &p.LayoutType,
			&p.Content, &p.ThumbnailURL, &p.SortOrder, &p.IsPremium, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		pages = append(pages, p)
	}
	return pages, nil
}

func (s *YearbookService) GetStudents(ctx context.Context, yearbookID string, limit, offset int) ([]model.Student, int, error) {
	// Get total count
	var total int
	err := s.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM students WHERE yearbook_id = $1 AND deleted_at IS NULL
	`, yearbookID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := s.db.Query(ctx, `
		SELECT id, yearbook_id, department_id, full_name, student_id, email, phone, quote,
		       avatar_image_url, major, minor, graduation_year, honors_awards, social_links,
		       custom_design, page_number, is_published, metadata, created_at, updated_at
		FROM students
		WHERE yearbook_id = $1 AND deleted_at IS NULL
		ORDER BY full_name ASC
		LIMIT $2 OFFSET $3
	`, yearbookID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	students := make([]model.Student, 0)
	for rows.Next() {
		var st model.Student
		if err := rows.Scan(&st.ID, &st.YearbookID, &st.DepartmentID, &st.FullName, &st.StudentID,
			&st.Email, &st.Phone, &st.Quote, &st.AvatarImageURL, &st.Major, &st.Minor,
			&st.GraduationYear, &st.HonorsAwards, &st.SocialLinks, &st.CustomDesign,
			&st.PageNumber, &st.IsPublished, &st.Metadata, &st.CreatedAt, &st.UpdatedAt); err != nil {
			return nil, 0, err
		}
		students = append(students, st)
	}
	return students, total, nil
}

func (s *YearbookService) GetStudentByID(ctx context.Context, id string) (*model.Student, error) {
	var st model.Student
	err := s.db.QueryRow(ctx, `
		SELECT id, yearbook_id, department_id, full_name, student_id, email, phone, quote,
		       avatar_image_url, major, minor, graduation_year, honors_awards, social_links,
		       custom_design, page_number, is_published, metadata, created_at, updated_at
		FROM students WHERE id = $1 AND deleted_at IS NULL
	`, id).Scan(
		&st.ID, &st.YearbookID, &st.DepartmentID, &st.FullName, &st.StudentID,
		&st.Email, &st.Phone, &st.Quote, &st.AvatarImageURL, &st.Major, &st.Minor,
		&st.GraduationYear, &st.HonorsAwards, &st.SocialLinks, &st.CustomDesign,
		&st.PageNumber, &st.IsPublished, &st.Metadata, &st.CreatedAt, &st.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("student not found")
	}
	return &st, nil
}

func (s *YearbookService) CreateStudent(ctx context.Context, req model.CreateStudentRequest) (*model.Student, error) {
	var st model.Student
	err := s.db.QueryRow(ctx, `
		INSERT INTO students (yearbook_id, department_id, full_name, student_id, email, phone, quote,
			avatar_image_url, major, minor, graduation_year, page_number)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING id, yearbook_id, department_id, full_name, student_id, email, phone, quote,
			avatar_image_url, major, minor, graduation_year, honors_awards, social_links,
			custom_design, page_number, is_published, metadata, created_at, updated_at
	`, req.YearbookID, req.DepartmentID, req.FullName, req.StudentID, req.Email, req.Phone,
		req.Quote, req.AvatarImageURL, req.Major, req.Minor, req.GraduationYear, req.PageNumber).Scan(
		&st.ID, &st.YearbookID, &st.DepartmentID, &st.FullName, &st.StudentID,
		&st.Email, &st.Phone, &st.Quote, &st.AvatarImageURL, &st.Major, &st.Minor,
		&st.GraduationYear, &st.HonorsAwards, &st.SocialLinks, &st.CustomDesign,
		&st.PageNumber, &st.IsPublished, &st.Metadata, &st.CreatedAt, &st.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create student: %w", err)
	}
	return &st, nil
}

func (s *YearbookService) SoftDeleteStudent(ctx context.Context, id string) error {
	_, err := s.db.Exec(ctx, `UPDATE students SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL`, id)
	return err
}
