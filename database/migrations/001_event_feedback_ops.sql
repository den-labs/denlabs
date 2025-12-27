-- =====================================================
-- Event Feedback Ops MVP - Database Migration
-- Version: 001
-- Description: Core tables for Event Labs, Feedback Items, Event Tracking, and Sessions
-- =====================================================

-- =====================================================
-- 1. EVENT_LABS TABLE
-- Core lab configuration with slug-based routing
-- =====================================================

CREATE TABLE IF NOT EXISTS event_labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  objective TEXT,
  surfaces_to_observe JSONB DEFAULT '[]'::jsonb,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  creator_id UUID REFERENCES lab_users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for event_labs
CREATE INDEX idx_event_labs_slug ON event_labs(slug);
CREATE INDEX idx_event_labs_creator_id ON event_labs(creator_id);
CREATE INDEX idx_event_labs_status ON event_labs(status);
CREATE INDEX idx_event_labs_dates ON event_labs(start_date, end_date);
CREATE INDEX idx_event_labs_created_at ON event_labs(created_at DESC);

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for event_labs
CREATE TRIGGER event_labs_updated_at_trigger
BEFORE UPDATE ON event_labs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. FEEDBACK_ITEMS TABLE
-- User feedback submissions with trust scoring
-- =====================================================

CREATE TABLE IF NOT EXISTS feedback_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES event_labs(id) ON DELETE CASCADE,
  message TEXT NOT NULL,

  -- User identification (denormalized for anonymous feedback)
  lab_user_id UUID REFERENCES lab_users(id) ON DELETE SET NULL,
  session_id VARCHAR(128),
  wallet_address VARCHAR(66),
  handle VARCHAR(64),

  -- Trust scoring fields (8004 integration)
  trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  trust_flags JSONB DEFAULT '{}'::jsonb,
  is_self_verified BOOLEAN DEFAULT false,
  has_wallet BOOLEAN DEFAULT false,

  -- Feedback metadata
  route VARCHAR(512),
  step VARCHAR(255),
  event_type VARCHAR(64),

  -- State management
  status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'done', 'spam')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  priority VARCHAR(10) CHECK (priority IN ('P0', 'P1', 'P2', 'P3') OR priority IS NULL),

  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for feedback_items
CREATE INDEX idx_feedback_items_lab_id ON feedback_items(lab_id);
CREATE INDEX idx_feedback_items_status ON feedback_items(status);
CREATE INDEX idx_feedback_items_trust_score ON feedback_items(trust_score);
CREATE INDEX idx_feedback_items_session_id ON feedback_items(session_id);
CREATE INDEX idx_feedback_items_created_at ON feedback_items(created_at DESC);
CREATE INDEX idx_feedback_items_priority ON feedback_items(priority);
CREATE INDEX idx_feedback_items_tags ON feedback_items USING GIN(tags);
CREATE INDEX idx_feedback_items_lab_user_id ON feedback_items(lab_user_id);

-- Trigger for feedback_items
CREATE TRIGGER feedback_items_updated_at_trigger
BEFORE UPDATE ON feedback_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. EVENT_TRACKING TABLE
-- Interaction events (page views, clicks, errors)
-- =====================================================

CREATE TABLE IF NOT EXISTS event_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID NOT NULL REFERENCES event_labs(id) ON DELETE CASCADE,
  session_id VARCHAR(128) NOT NULL,
  event_type VARCHAR(64) NOT NULL CHECK (event_type IN ('page_view', 'action_click', 'error_flag', 'custom')),
  route VARCHAR(512),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for event_tracking
CREATE INDEX idx_event_tracking_lab_id ON event_tracking(lab_id);
CREATE INDEX idx_event_tracking_session_id ON event_tracking(session_id);
CREATE INDEX idx_event_tracking_event_type ON event_tracking(event_type);
CREATE INDEX idx_event_tracking_created_at ON event_tracking(created_at DESC);
CREATE INDEX idx_event_tracking_route ON event_tracking(route);
CREATE INDEX idx_event_tracking_lab_session ON event_tracking(lab_id, session_id);

-- =====================================================
-- 4. LAB_SESSIONS TABLE
-- Session tracking with aggregated stats
-- =====================================================

CREATE TABLE IF NOT EXISTS lab_sessions (
  id VARCHAR(128) PRIMARY KEY,
  lab_id UUID NOT NULL REFERENCES event_labs(id) ON DELETE CASCADE,
  lab_user_id UUID REFERENCES lab_users(id) ON DELETE SET NULL,
  wallet_address VARCHAR(66),
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  event_count INTEGER DEFAULT 0,
  feedback_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for lab_sessions
CREATE INDEX idx_lab_sessions_lab_id ON lab_sessions(lab_id);
CREATE INDEX idx_lab_sessions_lab_user_id ON lab_sessions(lab_user_id);
CREATE INDEX idx_lab_sessions_last_seen ON lab_sessions(last_seen DESC);
CREATE INDEX idx_lab_sessions_wallet_address ON lab_sessions(wallet_address);

-- =====================================================
-- VERIFICATION QUERY
-- Run this after migration to verify all tables exist
-- =====================================================

-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN ('event_labs', 'feedback_items', 'event_tracking', 'lab_sessions')
-- ORDER BY table_name, ordinal_position;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Next steps:
-- 1. Verify tables created successfully
-- 2. Configure Row Level Security (RLS) policies if needed
-- 3. Test CRUD operations via Supabase dashboard
-- 4. Start implementing API endpoints
