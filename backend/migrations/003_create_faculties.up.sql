-- Faculties table
CREATE TABLE IF NOT EXISTS faculties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT,
    dean_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(university_id, code)
);

CREATE INDEX idx_faculties_university_id ON faculties(university_id);
CREATE INDEX idx_faculties_campus_id ON faculties(campus_id);
