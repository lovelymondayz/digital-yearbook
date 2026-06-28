-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yearbook_id UUID NOT NULL REFERENCES yearbooks(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    full_name VARCHAR(255) NOT NULL,
    student_id VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(20),
    quote TEXT,
    avatar_image_url TEXT,
    major VARCHAR(255),
    minor VARCHAR(255),
    graduation_year INTEGER,
    honors_awards JSONB NOT NULL DEFAULT '[]',
    social_links JSONB NOT NULL DEFAULT '{}',
    custom_design JSONB NOT NULL DEFAULT '{}',
    page_number INTEGER,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}',
    search_vector TSVECTOR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_students_yearbook_id ON students(yearbook_id);
CREATE INDEX idx_students_department_id ON students(department_id);
CREATE INDEX idx_students_full_name ON students(full_name);
CREATE INDEX idx_students_full_name_trgm ON students USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_graduation_year ON students(graduation_year);
CREATE INDEX idx_students_is_published ON students(is_published);
CREATE INDEX idx_students_deleted_at ON students(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_search ON students USING gin(search_vector);

-- Function to auto-update search vector
CREATE OR REPLACE FUNCTION students_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.full_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.quote, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.major, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.student_id, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_students_search_vector
    BEFORE INSERT OR UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION students_search_vector_update();
