-- =====================================================
-- Denlabs Spray - RLS Hardening + Indexes
-- Description: Force RLS and add indexes for policy performance
-- Created: 2026-02-03
-- =====================================================

DO $$
BEGIN
  -- ============================
  -- Sprays
  -- ============================
  IF to_regclass('public.sprays') IS NOT NULL THEN
    -- Force RLS to prevent owner bypass
    ALTER TABLE public.sprays FORCE ROW LEVEL SECURITY;

    -- Index for RLS policy on lab_user_id
    IF NOT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'sprays'
        AND indexname = 'sprays_lab_user_id_idx'
    ) THEN
      CREATE INDEX sprays_lab_user_id_idx ON public.sprays (lab_user_id);
    END IF;
  END IF;

  -- ============================
  -- Spray Events
  -- ============================
  IF to_regclass('public.spray_events') IS NOT NULL THEN
    -- Force RLS to prevent owner bypass
    ALTER TABLE public.spray_events FORCE ROW LEVEL SECURITY;

    -- Index for RLS policy on spray_id
    IF NOT EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'spray_events'
        AND indexname = 'spray_events_spray_id_idx'
    ) THEN
      CREATE INDEX spray_events_spray_id_idx ON public.spray_events (spray_id);
    END IF;
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
