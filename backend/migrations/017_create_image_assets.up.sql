-- Image assets table (metadata only, actual images stored in Immich)
CREATE TABLE IF NOT EXISTS image_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
    yearbook_id UUID REFERENCES yearbooks(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    original_url TEXT NOT NULL,
    optimized_url TEXT,
    thumbnail_url TEXT,
    webp_url TEXT,
    file_size BIGINT,
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    alt_text VARCHAR(500),
    metadata JSONB NOT NULL DEFAULT '{}',
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_image_assets_university_id ON image_assets(university_id);
CREATE INDEX idx_image_assets_yearbook_id ON image_assets(yearbook_id);
CREATE INDEX idx_image_assets_uploaded_by ON image_assets(uploaded_by);
CREATE INDEX idx_image_assets_mime_type ON image_assets(mime_type);
