-- Yearbooks table
CREATE TABLE IF NOT EXISTS yearbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    campus_id UUID REFERENCES campuses(id) ON DELETE SET NULL,
    year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    cover_image_url TEXT,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMPTZ,
    settings JSONB NOT NULL DEFAULT '{}',
    theme JSONB NOT NULL DEFAULT '{}',
    version INTEGER NOT NULL DEFAULT 1,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(university_id, year, slug)
);

CREATE INDEX idx_yearbooks_university_id ON yearbooks(university_id);
CREATE INDEX idx_yearbooks_campus_id ON yearbooks(campus_id);
CREATE INDEX idx_yearbooks_year ON yearbooks(year);
CREATE INDEX idx_yearbooks_slug ON yearbooks(slug);
CREATE INDEX idx_yearbooks_status ON yearbooks(status);
CREATE INDEX idx_yearbooks_published_at ON yearbooks(published_at) WHERE published_at IS NOT NULL;
CREATE INDEX idx_yearbooks_deleted_at ON yearbooks(deleted_at) WHERE deleted_at IS NULL;
