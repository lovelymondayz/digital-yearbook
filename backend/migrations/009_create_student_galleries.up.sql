-- Student galleries table
CREATE TABLE IF NOT EXISTS student_galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    yearbook_page_id UUID REFERENCES yearbook_pages(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_student_galleries_student_id ON student_galleries(student_id);
CREATE INDEX idx_student_galleries_yearbook_page_id ON student_galleries(yearbook_page_id);
