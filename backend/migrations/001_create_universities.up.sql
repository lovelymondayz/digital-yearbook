-- Universities table
CREATE TABLE IF NOT EXISTS universities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#1a1a2e',
    settings JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_universities_slug ON universities(slug);
CREATE INDEX idx_universities_subdomain ON universities(subdomain);
CREATE INDEX idx_universities_status ON universities(status);
