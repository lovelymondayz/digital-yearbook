-- Permissions table (RBAC)
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    allowed BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(role, resource, action)
);

CREATE INDEX idx_permissions_role ON permissions(role);
CREATE INDEX idx_permissions_resource ON permissions(resource);

-- Seed default permissions
INSERT INTO permissions (role, resource, action, allowed) VALUES
    ('super_admin', '*', '*', TRUE),
    ('admin', 'yearbooks', 'create', TRUE),
    ('admin', 'yearbooks', 'read', TRUE),
    ('admin', 'yearbooks', 'update', TRUE),
    ('admin', 'yearbooks', 'delete', TRUE),
    ('admin', 'students', 'create', TRUE),
    ('admin', 'students', 'read', TRUE),
    ('admin', 'students', 'update', TRUE),
    ('admin', 'students', 'delete', TRUE),
    ('admin', 'pages', 'create', TRUE),
    ('admin', 'pages', 'read', TRUE),
    ('admin', 'pages', 'update', TRUE),
    ('admin', 'pages', 'delete', TRUE),
    ('admin', 'analytics', 'read', TRUE),
    ('admin', 'audit_logs', 'read', TRUE),
    ('editor', 'yearbooks', 'read', TRUE),
    ('editor', 'yearbooks', 'update', TRUE),
    ('editor', 'students', 'create', TRUE),
    ('editor', 'students', 'read', TRUE),
    ('editor', 'students', 'update', TRUE),
    ('editor', 'pages', 'create', TRUE),
    ('editor', 'pages', 'read', TRUE),
    ('editor', 'pages', 'update', TRUE),
    ('viewer', 'yearbooks', 'read', TRUE),
    ('viewer', 'students', 'read', TRUE),
    ('viewer', 'pages', 'read', TRUE)
ON CONFLICT (role, resource, action) DO NOTHING;
