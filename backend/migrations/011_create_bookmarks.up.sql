-- Bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    yearbook_id UUID NOT NULL REFERENCES yearbooks(id) ON DELETE CASCADE,
    yearbook_page_id UUID REFERENCES yearbook_pages(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, yearbook_id, yearbook_page_id, student_id)
);

CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_yearbook_id ON bookmarks(yearbook_id);
