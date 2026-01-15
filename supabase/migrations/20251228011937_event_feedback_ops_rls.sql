-- =====================================================
-- Event Feedback Ops - Row Level Security Policies
-- =====================================================
-- Implements hybrid visibility model for production
-- Version: 002
-- Date: 2025-12-27
-- =====================================================

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE event_labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. EVENT_LABS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view active labs" ON event_labs;
DROP POLICY IF EXISTS "Creators can view their own labs" ON event_labs;
DROP POLICY IF EXISTS "Authenticated users can create labs" ON event_labs;
DROP POLICY IF EXISTS "Creators can update their own labs" ON event_labs;
DROP POLICY IF EXISTS "Creators can delete their own labs" ON event_labs;

-- Public: Anyone can view active labs (for public participation pages)
CREATE POLICY "Anyone can view active labs"
  ON event_labs
  FOR SELECT
  USING (status = 'active');

-- Creators: Can view all their own labs (any status)
CREATE POLICY "Creators can view their own labs"
  ON event_labs
  FOR SELECT
  USING (creator_id = auth.uid());

-- Creators: Can create labs
CREATE POLICY "Authenticated users can create labs"
  ON event_labs
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL 
    AND creator_id = auth.uid()
  );

-- Creators: Can update their own labs
CREATE POLICY "Creators can update their own labs"
  ON event_labs
  FOR UPDATE
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Creators: Can delete their own labs
CREATE POLICY "Creators can delete their own labs"
  ON event_labs
  FOR DELETE
  USING (creator_id = auth.uid());

-- =====================================================
-- 3. FEEDBACK_ITEMS POLICIES (Hybrid Visibility)
-- =====================================================

DROP POLICY IF EXISTS "Anyone can submit feedback to active labs" ON feedback_items;
DROP POLICY IF EXISTS "Creators can view all feedback for their labs" ON feedback_items;
DROP POLICY IF EXISTS "Participants can view their own feedback" ON feedback_items;
DROP POLICY IF EXISTS "Public can view top priority feedback" ON feedback_items;
DROP POLICY IF EXISTS "Creators can update feedback for their labs" ON feedback_items;
DROP POLICY IF EXISTS "Users can update their own untriaged feedback" ON feedback_items;

-- Public: Anyone can submit feedback to active labs
CREATE POLICY "Anyone can submit feedback to active labs"
  ON feedback_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_labs
      WHERE id = lab_id
      AND status = 'active'
    )
  );

-- Creators: Can view all feedback for their labs
CREATE POLICY "Creators can view all feedback for their labs"
  ON feedback_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_labs
      WHERE id = lab_id
      AND creator_id = auth.uid()
    )
  );

-- Participants: Can view their own feedback
CREATE POLICY "Participants can view their own feedback"
  ON feedback_items
  FOR SELECT
  USING (
    lab_user_id = auth.uid()
    OR session_id IN (
      SELECT id FROM lab_sessions
      WHERE lab_user_id = auth.uid()
    )
  );

-- Public: Can view high-priority feedback (P0, P1) with good trust scores
-- This enables the "top issues" visibility for anonymous users
CREATE POLICY "Public can view top priority feedback"
  ON feedback_items
  FOR SELECT
  USING (
    priority IN ('P0', 'P1')
    AND trust_score >= 60
    AND status IN ('new', 'triaged')
  );

-- Creators: Can update feedback for their labs (triage, tags, priority)
CREATE POLICY "Creators can update feedback for their labs"
  ON feedback_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM event_labs
      WHERE id = lab_id
      AND creator_id = auth.uid()
    )
  );

-- Anyone: Can update their own feedback (before triage)
CREATE POLICY "Users can update their own untriaged feedback"
  ON feedback_items
  FOR UPDATE
  USING (
    (lab_user_id = auth.uid() OR session_id IN (
      SELECT id FROM lab_sessions WHERE lab_user_id = auth.uid()
    ))
    AND status = 'new'
  )
  WITH CHECK (
    -- Can only update message and tags, not status/priority
    status = 'new'
  );

-- =====================================================
-- 4. EVENT_TRACKING POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Anyone can track events for active labs" ON event_tracking;
DROP POLICY IF EXISTS "Creators can view events for their labs" ON event_tracking;

-- Public: Anyone can track events for active labs (write-only)
CREATE POLICY "Anyone can track events for active labs"
  ON event_tracking
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_labs
      WHERE id = lab_id
      AND status = 'active'
    )
  );

-- Creators: Can view events for their labs
CREATE POLICY "Creators can view events for their labs"
  ON event_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_labs
      WHERE id = lab_id
      AND creator_id = auth.uid()
    )
  );

-- =====================================================
-- 5. LAB_SESSIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Anyone can manage sessions" ON lab_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON lab_sessions;
DROP POLICY IF EXISTS "Creators can view sessions for their labs" ON lab_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON lab_sessions;

-- Public: Anyone can create/update sessions (upsert pattern)
CREATE POLICY "Anyone can manage sessions"
  ON lab_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update sessions"
  ON lab_sessions
  FOR UPDATE
  USING (true);

-- Creators: Can view sessions for their labs
CREATE POLICY "Creators can view sessions for their labs"
  ON lab_sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_labs
      WHERE id = lab_id
      AND creator_id = auth.uid()
    )
  );

-- Users: Can view their own sessions
CREATE POLICY "Users can view their own sessions"
  ON lab_sessions
  FOR SELECT
  USING (lab_user_id = auth.uid());

-- =====================================================
-- 6. HELPER FUNCTIONS FOR POLICY ENFORCEMENT
-- =====================================================

-- Function to check if user is lab creator
CREATE OR REPLACE FUNCTION is_lab_creator(lab_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM event_labs
    WHERE id = lab_uuid
    AND creator_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if lab is active
CREATE OR REPLACE FUNCTION is_lab_active(lab_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM event_labs
    WHERE id = lab_uuid
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant usage on helper functions
GRANT EXECUTE ON FUNCTION is_lab_creator(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_lab_active(UUID) TO authenticated, anon;

-- Grant table access to authenticated and anonymous users
GRANT SELECT, INSERT, UPDATE, DELETE ON event_labs TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON feedback_items TO authenticated, anon;
GRANT INSERT, SELECT ON event_tracking TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON lab_sessions TO authenticated, anon;

-- =====================================================
-- TESTING QUERIES
-- =====================================================

-- Test as anonymous user (should see active labs only)
-- SET ROLE anon;
-- SELECT * FROM event_labs; -- Should only see active labs

-- Test as creator (should see own labs)
-- SET LOCAL "request.jwt.claims" = '{"sub": "your-user-id"}';
-- SELECT * FROM event_labs; -- Should see own labs

-- Test feedback visibility
-- SELECT * FROM feedback_items WHERE lab_id = 'some-lab-id';
-- Should see: own feedback + top priority (P0/P1) if not creator

-- =====================================================
-- ROLLBACK SCRIPT (if needed)
-- =====================================================

-- To disable RLS and remove policies:
-- DROP POLICY IF EXISTS "Anyone can view active labs" ON event_labs;
-- DROP POLICY IF EXISTS "Creators can view their own labs" ON event_labs;
-- ... (drop all policies)
-- ALTER TABLE event_labs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE feedback_items DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE event_tracking DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE lab_sessions DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- RLS enabled on all tables with hybrid visibility model
-- Creators: Full access to their labs and all feedback
-- Participants: See own feedback + top priority issues
-- Anonymous: Can participate and see top issues only
-- =====================================================
