-- =====================================================
-- Migration: 001_initial_schema.sql
-- Description: Initial database schema for DenLabs
-- Created: 2026-01-08
-- Tables: lab_users, event_labs, feedback_items
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE: lab_users
-- Description: User profiles for DenLabs platform
-- =====================================================

CREATE TABLE IF NOT EXISTS lab_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  handle VARCHAR(32) UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,

  -- Role and authentication
  role VARCHAR(20) NOT NULL DEFAULT 'player'
    CHECK (role IN ('player', 'organizer', 'sponsor')),
  wallet_address VARCHAR(42) UNIQUE,
  self_verified BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lab_users
CREATE INDEX IF NOT EXISTS idx_lab_users_wallet ON lab_users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_lab_users_handle ON lab_users(handle);
CREATE INDEX IF NOT EXISTS idx_lab_users_role ON lab_users(role);
CREATE INDEX IF NOT EXISTS idx_lab_users_created_at ON lab_users(created_at DESC);

-- Updated_at trigger for lab_users
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lab_users_updated_at
  BEFORE UPDATE ON lab_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: event_labs
-- Description: Event labs created by users
-- =====================================================

CREATE TABLE IF NOT EXISTS event_labs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  slug VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  objective TEXT,

  -- Configuration
  surfaces_to_observe TEXT[] NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed')),

  -- Dates
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,

  -- Relations
  creator_id UUID REFERENCES lab_users(id) ON DELETE SET NULL,

  -- Metadata (flexible JSONB for custom fields)
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for event_labs
CREATE INDEX IF NOT EXISTS idx_event_labs_slug ON event_labs(slug);
CREATE INDEX IF NOT EXISTS idx_event_labs_creator_id ON event_labs(creator_id);
CREATE INDEX IF NOT EXISTS idx_event_labs_status ON event_labs(status);
CREATE INDEX IF NOT EXISTS idx_event_labs_start_date ON event_labs(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_event_labs_created_at ON event_labs(created_at DESC);

-- Updated_at trigger for event_labs
CREATE TRIGGER update_event_labs_updated_at
  BEFORE UPDATE ON event_labs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE: feedback_items
-- Description: Feedback submitted by users for event labs
-- =====================================================

CREATE TABLE IF NOT EXISTS feedback_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relations
  lab_id UUID NOT NULL REFERENCES event_labs(id) ON DELETE CASCADE,
  lab_user_id UUID REFERENCES lab_users(id) ON DELETE SET NULL,

  -- Content
  message TEXT NOT NULL,

  -- Session and identity tracking
  session_id VARCHAR(255),
  wallet_address VARCHAR(42),
  handle VARCHAR(32),

  -- Trust scoring
  trust_score INT NOT NULL DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  trust_flags JSONB NOT NULL DEFAULT '{}',
  is_self_verified BOOLEAN NOT NULL DEFAULT false,
  has_wallet BOOLEAN NOT NULL DEFAULT false,

  -- Context
  route TEXT,
  step TEXT,
  event_type VARCHAR(50),

  -- Status and priority
  status VARCHAR(20) NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'triaged', 'done', 'spam')),
  priority VARCHAR(10)
    CHECK (priority IN ('P0', 'P1', 'P2', 'P3', NULL)),
  tags TEXT[] NOT NULL DEFAULT '{}',

  -- Metadata (flexible JSONB for custom fields)
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for feedback_items
CREATE INDEX IF NOT EXISTS idx_feedback_items_lab_id ON feedback_items(lab_id);
CREATE INDEX IF NOT EXISTS idx_feedback_items_lab_user_id ON feedback_items(lab_user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_items_session_id ON feedback_items(session_id);
CREATE INDEX IF NOT EXISTS idx_feedback_items_status ON feedback_items(status);
CREATE INDEX IF NOT EXISTS idx_feedback_items_priority ON feedback_items(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_items_created_at ON feedback_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_items_trust_score ON feedback_items(trust_score DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_feedback_items_lab_status ON feedback_items(lab_id, status);

-- Updated_at trigger for feedback_items
CREATE TRIGGER update_feedback_items_updated_at
  BEFORE UPDATE ON feedback_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE lab_users IS 'User profiles for DenLabs platform';
COMMENT ON COLUMN lab_users.handle IS 'Unique username (3-32 chars, alphanumeric + _.- allowed)';
COMMENT ON COLUMN lab_users.role IS 'User role: player (builder), organizer (run operator), sponsor (viewer)';
COMMENT ON COLUMN lab_users.wallet_address IS 'Ethereum wallet address (0x...)';
COMMENT ON COLUMN lab_users.self_verified IS 'Whether user has completed Self.xyz verification';

COMMENT ON TABLE event_labs IS 'Event labs created by users for feedback collection';
COMMENT ON COLUMN event_labs.slug IS 'URL-friendly identifier (auto-generated from name)';
COMMENT ON COLUMN event_labs.surfaces_to_observe IS 'Array of surface types to track (e.g., ["web", "mobile"])';
COMMENT ON COLUMN event_labs.status IS 'Lab status: active (accepting feedback), paused, completed';
COMMENT ON COLUMN event_labs.metadata IS 'Flexible JSONB for custom lab configuration';

COMMENT ON TABLE feedback_items IS 'Feedback submitted by users for event labs';
COMMENT ON COLUMN feedback_items.trust_score IS 'Calculated trust score (0-100) based on verification flags';
COMMENT ON COLUMN feedback_items.trust_flags IS 'JSONB containing trust verification details';
COMMENT ON COLUMN feedback_items.status IS 'Feedback status: new, triaged (acknowledged), done (resolved), spam';
COMMENT ON COLUMN feedback_items.priority IS 'Priority level: P0 (critical), P1 (high), P2 (medium), P3 (low)';
COMMENT ON COLUMN feedback_items.metadata IS 'Flexible JSONB for custom event data';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
