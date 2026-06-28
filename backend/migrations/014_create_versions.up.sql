-- Versions table (yearbook version history)
CREATE TABLE IF NOT EXISTS versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yearbook_id UUID NOT NULL REFERENCES yearbooks(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    changes_summary TEXT,
    snapshot JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(yearbook_id, version_number)
);

CREATE INDEX idx_versions_yearbook_id ON versions(yearbook_id);
CREATE INDEX idx_versions_created_by ON versions(created_by);
