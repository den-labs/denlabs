# Event Feedback Ops - Database Migration

## Prerequisites
- Supabase project with admin access
- SQL Editor access in Supabase Dashboard

## Steps

1. Navigate to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy contents of `001_event_feedback_ops.sql`
4. Execute query
5. Verify tables created: `event_labs`, `feedback_items`, `event_tracking`, `lab_sessions`

## Verification

After running the migration, verify the tables exist:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('event_labs', 'feedback_items', 'event_tracking', 'lab_sessions');
```

You should see all 4 tables listed.

## Rollback

If you need to rollback this migration:

```sql
DROP TABLE IF EXISTS lab_sessions CASCADE;
DROP TABLE IF EXISTS event_tracking CASCADE;
DROP TABLE IF EXISTS feedback_items CASCADE;
DROP TABLE IF EXISTS event_labs CASCADE;
```

**WARNING:** This will delete all data in these tables. Only use in development.

## Schema Overview

### `event_labs`
Core lab configuration with slug-based routing.

### `feedback_items`
User feedback submissions with trust scoring and triage fields.

### `event_tracking`
Interaction events (page views, clicks, errors) for lab sessions.

### `lab_sessions`
Session tracking with aggregated stats (event_count, feedback_count).

## Next Steps

After running the migration:
1. Verify tables and indexes exist
2. Test CRUD operations via Supabase dashboard
3. Configure Row Level Security (RLS) policies if needed
4. Start the Next.js development server
