-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
    yearbook_id UUID REFERENCES yearbooks(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}',
    session_id VARCHAR(100),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_university_id ON analytics_events(university_id);
CREATE INDEX idx_analytics_events_yearbook_id ON analytics_events(yearbook_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
