-- Yearbook pages table
CREATE TABLE IF NOT EXISTS yearbook_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yearbook_id UUID NOT NULL REFERENCES yearbooks(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    title VARCHAR(255),
    layout_type VARCHAR(50) NOT NULL DEFAULT 'default' CHECK (layout_type IN ('default', 'custom', 'cover', 'divider', 'class_photo')),
    content JSONB NOT NULL DEFAULT '{}',
    thumbnail_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(yearbook_id, page_number)
);

CREATE INDEX idx_yearbook_pages_yearbook_id ON yearbook_pages(yearbook_id);
CREATE INDEX idx_yearbook_pages_sort_order ON yearbook_pages(yearbook_id, sort_order);
CREATE INDEX idx_yearbook_pages_deleted_at ON yearbook_pages(deleted_at) WHERE deleted_at IS NULL;
