-- =====================================================
-- Spray Batches - Database Migration
-- Version: 004
-- Description: spray_batches table for per-batch execution tracking
-- Created: 2026-01-15
-- =====================================================

-- =====================================================
-- TABLE: spray_batches
-- Description: Batch execution metadata for a spray
-- =====================================================

CREATE TABLE IF NOT EXISTS spray_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spray_id UUID NOT NULL REFERENCES sprays(id) ON DELETE CASCADE,
  batch_index INT NOT NULL,
  batch_size INT NOT NULL DEFAULT 200,
  recipients_count INT NOT NULL,
  status TEXT NOT NULL
    CHECK (status IN ('queued', 'sent', 'confirmed', 'failed')),
  tx_hash TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_spray_batches_unique
  ON spray_batches(spray_id, batch_index);
CREATE INDEX IF NOT EXISTS idx_spray_batches_spray_id
  ON spray_batches(spray_id);
CREATE INDEX IF NOT EXISTS idx_spray_batches_status
  ON spray_batches(status);
CREATE INDEX IF NOT EXISTS idx_spray_batches_created_at
  ON spray_batches(created_at DESC);

DROP TRIGGER IF EXISTS spray_batches_updated_at_trigger ON spray_batches;
CREATE TRIGGER spray_batches_updated_at_trigger
  BEFORE UPDATE ON spray_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE spray_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Spray owners can view batches" ON spray_batches;
CREATE POLICY "Spray owners can view batches"
  ON spray_batches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM sprays
      WHERE sprays.id = spray_batches.spray_id
      AND sprays.lab_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Spray owners can insert batches" ON spray_batches;
CREATE POLICY "Spray owners can insert batches"
  ON spray_batches
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM sprays
      WHERE sprays.id = spray_batches.spray_id
      AND sprays.lab_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Spray owners can update batches" ON spray_batches;
CREATE POLICY "Spray owners can update batches"
  ON spray_batches
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM sprays
      WHERE sprays.id = spray_batches.spray_id
      AND sprays.lab_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM sprays
      WHERE sprays.id = spray_batches.spray_id
      AND sprays.lab_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Spray owners can delete batches" ON spray_batches;
CREATE POLICY "Spray owners can delete batches"
  ON spray_batches
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM sprays
      WHERE sprays.id = spray_batches.spray_id
      AND sprays.lab_user_id = auth.uid()
    )
  );

-- =====================================================
-- COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE spray_batches IS 'Batch execution metadata for Spray sends';
COMMENT ON COLUMN spray_batches.batch_index IS 'Zero-based index of the batch in the spray';
COMMENT ON COLUMN spray_batches.status IS 'Batch status: queued, sent, confirmed, failed';
COMMENT ON COLUMN spray_batches.tx_hash IS 'Transaction hash for the batch, if sent';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
