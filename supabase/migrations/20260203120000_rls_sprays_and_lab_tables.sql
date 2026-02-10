-- =====================================================
-- Spray + Lab Tables - Row Level Security Enablement
-- Description: Enables RLS for sprays, spray_events, lab_login_events, lab_trust_metrics
-- Created: 2026-02-03
-- =====================================================

DO $$
BEGIN
  -- ============================
  -- Sprays
  -- ============================
  IF to_regclass('public.sprays') IS NOT NULL THEN
    ALTER TABLE public.sprays ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Spray owners can view sprays" ON public.sprays;
    CREATE POLICY "Spray owners can view sprays"
      ON public.sprays
      FOR SELECT
      TO authenticated
      USING (lab_user_id = (select auth.uid()));

    DROP POLICY IF EXISTS "Spray owners can insert sprays" ON public.sprays;
    CREATE POLICY "Spray owners can insert sprays"
      ON public.sprays
      FOR INSERT
      TO authenticated
      WITH CHECK (lab_user_id = (select auth.uid()));

    DROP POLICY IF EXISTS "Spray owners can update sprays" ON public.sprays;
    CREATE POLICY "Spray owners can update sprays"
      ON public.sprays
      FOR UPDATE
      TO authenticated
      USING (lab_user_id = (select auth.uid()))
      WITH CHECK (lab_user_id = (select auth.uid()));

    DROP POLICY IF EXISTS "Spray owners can delete sprays" ON public.sprays;
    CREATE POLICY "Spray owners can delete sprays"
      ON public.sprays
      FOR DELETE
      TO authenticated
      USING (lab_user_id = (select auth.uid()));

    GRANT SELECT, INSERT, UPDATE, DELETE ON public.sprays TO authenticated;
  END IF;

  -- ============================
  -- Spray Events
  -- ============================
  IF to_regclass('public.spray_events') IS NOT NULL THEN
    ALTER TABLE public.spray_events ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Spray owners can view events" ON public.spray_events;
    CREATE POLICY "Spray owners can view events"
      ON public.spray_events
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.sprays
          WHERE sprays.id = spray_events.spray_id
          AND sprays.lab_user_id = (select auth.uid())
        )
      );

    DROP POLICY IF EXISTS "Spray owners can insert events" ON public.spray_events;
    CREATE POLICY "Spray owners can insert events"
      ON public.spray_events
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.sprays
          WHERE sprays.id = spray_events.spray_id
          AND sprays.lab_user_id = (select auth.uid())
        )
      );

    DROP POLICY IF EXISTS "Spray owners can update events" ON public.spray_events;
    CREATE POLICY "Spray owners can update events"
      ON public.spray_events
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.sprays
          WHERE sprays.id = spray_events.spray_id
          AND sprays.lab_user_id = (select auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.sprays
          WHERE sprays.id = spray_events.spray_id
          AND sprays.lab_user_id = (select auth.uid())
        )
      );

    DROP POLICY IF EXISTS "Spray owners can delete events" ON public.spray_events;
    CREATE POLICY "Spray owners can delete events"
      ON public.spray_events
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.sprays
          WHERE sprays.id = spray_events.spray_id
          AND sprays.lab_user_id = (select auth.uid())
        )
      );

    GRANT SELECT, INSERT, UPDATE, DELETE ON public.spray_events TO authenticated;
  END IF;

  -- ============================
  -- Lab Login Events
  -- ============================
  IF to_regclass('public.lab_login_events') IS NOT NULL THEN
    ALTER TABLE public.lab_login_events ENABLE ROW LEVEL SECURITY;
  END IF;

  -- ============================
  -- Lab Trust Metrics
  -- ============================
  IF to_regclass('public.lab_trust_metrics') IS NOT NULL THEN
    ALTER TABLE public.lab_trust_metrics ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
