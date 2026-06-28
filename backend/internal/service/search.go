package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/lovelymondayz/digital-yearbook/backend/internal/model"
)

type SearchService struct {
	db *pgxpool.Pool
}

func NewSearchService(db *pgxpool.Pool) *SearchService {
	return &SearchService{db: db}
}

func (s *SearchService) SearchStudents(ctx context.Context, query string, filters SearchFilters) (*model.SearchResult, error) {
	if strings.TrimSpace(query) == "" && !filters.HasFilters() {
		return &model.SearchResult{Students: []model.Student{}, Total: 0}, nil
	}

	// Build dynamic query
	var conditions []string
	var args []interface{}
	argIdx := 1

	// Full-text search
	if query != "" {
		conditions = append(conditions, fmt.Sprintf("(search_vector @@ plainto_tsquery('english', $%d) OR full_name ILIKE $%d)", argIdx, argIdx))
		args = append(args, query)
		argIdx++
	}

	// Year filter
	if filters.Year > 0 {
		conditions = append(conditions, fmt.Sprintf("yearbook_id IN (SELECT id FROM yearbooks WHERE year = $%d)", argIdx))
		args = append(args, filters.Year)
		argIdx++
	}

	// Department filter
	if filters.Department != "" {
		conditions = append(conditions, fmt.Sprintf("department_id IN (SELECT id FROM departments WHERE name ILIKE $%d)", argIdx))
		args = append(args, "%"+filters.Department+"%")
		argIdx++
	}

	// Faculty filter
	if filters.Faculty != "" {
		conditions = append(conditions, fmt.Sprintf(`department_id IN (
			SELECT d.id FROM departments d
			JOIN faculties f ON f.id = d.faculty_id
			WHERE f.name ILIKE $%d
		)`, argIdx))
		args = append(args, "%"+filters.Faculty+"%")
		argIdx++
	}

	// Yearbook ID filter
	if filters.YearbookID != "" {
		conditions = append(conditions, fmt.Sprintf("yearbook_id = $%d", argIdx))
		args = append(args, filters.YearbookID)
		argIdx++
	}

	conditions = append(conditions, "deleted_at IS NULL")
	conditions = append(conditions, "is_published = TRUE")

	whereClause := strings.Join(conditions, " AND ")

	// Count total
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM students WHERE %s", whereClause)
	var total int
	err := s.db.QueryRow(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, fmt.Errorf("count search results: %w", err)
	}

	// Fetch results
	limit := 20
	if filters.Limit > 0 {
		filters.Limit = limit
	}

	dataQuery := fmt.Sprintf(`
		SELECT id, yearbook_id, department_id, full_name, student_id, email, phone, quote,
		       avatar_image_url, major, minor, graduation_year, honors_awards, social_links,
		       custom_design, page_number, is_published, metadata, created_at, updated_at
		FROM students
		WHERE %s
		ORDER BY full_name ASC
		LIMIT %d OFFSET %d
	`, whereClause, limit, filters.Offset)

	rows, err := s.db.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("search students: %w", err)
	}
	defer rows.Close()

	students := make([]model.Student, 0)
	for rows.Next() {
		var st model.Student
		if err := rows.Scan(&st.ID, &st.YearbookID, &st.DepartmentID, &st.FullName, &st.StudentID,
			&st.Email, &st.Phone, &st.Quote, &st.AvatarImageURL, &st.Major, &st.Minor,
			&st.GraduationYear, &st.HonorsAwards, &st.SocialLinks, &st.CustomDesign,
			&st.PageNumber, &st.IsPublished, &st.Metadata, &st.CreatedAt, &st.UpdatedAt); err != nil {
			return nil, err
		}
		students = append(students, st)
	}

	return &model.SearchResult{
		Students: students,
		Total:    total,
	}, nil
}

type SearchFilters struct {
	Query      string
	Year       int
	Department string
	Faculty    string
	YearbookID string
	Limit      int
	Offset     int
}

func (f SearchFilters) HasFilters() bool {
	return f.Year > 0 || f.Department != "" || f.Faculty != "" || f.YearbookID != ""
}
