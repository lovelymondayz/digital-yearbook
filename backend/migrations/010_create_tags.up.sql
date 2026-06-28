-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tags_slug ON tags(slug);

-- Student tags junction table
CREATE TABLE IF NOT EXISTS student_tags (
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, tag_id)
);

CREATE INDEX idx_student_tags_tag_id ON student_tags(tag_id);
