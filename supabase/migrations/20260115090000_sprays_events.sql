-- =====================================================
-- Spray Events - Database Migration
-- Version: 003
-- Description: sprays + spray_events tables for Spray telemetry
-- Created: 2026-01-15
-- =====================================================

-- =====================================================
-- TABLE: sprays
-- Description: Tracks spray sends and lifecycle status
-- =====================================================

CREATE TABLE IF NOT EXISTS sprays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  lab_user_id UUID REFERENCES lab_users(id) ON DELETE SET NULL,

  -- Identity
  wallet_address VARCHAR(42),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'started', 'completed', 'failed')),

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sprays_lab_user_id ON sprays(lab_user_id);
CREATE INDEX IF NOT EXISTS idx_sprays_status ON sprays(status);
CREATE INDEX IF NOT EXISTS idx_sprays_created_at ON sprays(created_at DESC);

CREATE TRIGGER sprays_updated_at_trigger
  BEFORE UPDATE ON sprays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: spray_events
-- Description: Events emitted during Spray UX lifecycle
-- =====================================================

CREATE TABLE IF NOT EXISTS spray_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  spray_id UUID NOT NULL REFERENCES sprays(id) ON DELETE CASCADE,

  -- Event details
  event_type VARCHAR(40) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_spray_events_spray_id ON spray_events(spray_id);
CREATE INDEX IF NOT EXISTS idx_spray_events_event_type ON spray_events(event_type);
CREATE INDEX IF NOT EXISTS idx_spray_events_created_at ON spray_events(created_at DESC);

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE sprays IS 'Spray send records with lifecycle status';
COMMENT ON COLUMN sprays.status IS 'Spray status: draft, started, completed, failed';
COMMENT ON COLUMN sprays.metadata IS 'Flexible JSONB for spray metadata (token, network, totals)';

COMMENT ON TABLE spray_events IS 'Event log for Spray UX lifecycle';
COMMENT ON COLUMN spray_events.event_type IS 'Event type (paste_opened, send_started, etc.)';
COMMENT ON COLUMN spray_events.metadata IS 'Event metadata payload';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
