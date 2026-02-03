begin;

-- 1) Functions: avoid RLS bypass
create or replace function public.is_lab_active(lab_uuid uuid)
returns boolean
language plpgsql
security invoker
set search_path = public
as $function$
begin
  return exists (
    select 1 from event_labs
    where id = lab_uuid
      and status = 'active'
  );
end;
$function$;

create or replace function public.is_lab_creator(lab_uuid uuid)
returns boolean
language plpgsql
security invoker
set search_path = public
as $function$
begin
  return exists (
    select 1 from event_labs
    where id = lab_uuid
      and creator_id = auth.uid()
  );
end;
$function$;

-- 2) event_labs
drop policy if exists "Anyone can view active labs" on public.event_labs;
drop policy if exists "Creators can view their own labs" on public.event_labs;
drop policy if exists "Authenticated users can create labs" on public.event_labs;
drop policy if exists "Creators can update their own labs" on public.event_labs;
drop policy if exists "Creators can delete their own labs" on public.event_labs;

create policy "Authenticated can view active labs"
on public.event_labs
for select
to authenticated
using ((status)::text = 'active'::text);

create policy "Creators can view their own labs"
on public.event_labs
for select
to authenticated
using (creator_id = auth.uid());

create policy "Authenticated can create labs"
on public.event_labs
for insert
to authenticated
with check (auth.uid() is not null and creator_id = auth.uid());

create policy "Creators can update their own labs"
on public.event_labs
for update
to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());

create policy "Creators can delete their own labs"
on public.event_labs
for delete
to authenticated
using (creator_id = auth.uid());

-- 3) event_tracking
drop policy if exists "Anyone can track events for active labs" on public.event_tracking;
drop policy if exists "Creators can view events for their labs" on public.event_tracking;

create policy "Authenticated can track events for active labs"
on public.event_tracking
for insert
to authenticated
with check (
  exists (
    select 1 from event_labs
    where event_labs.id = event_tracking.lab_id
      and (event_labs.status)::text = 'active'::text
  )
);

create policy "Creators can view events for their labs"
on public.event_tracking
for select
to authenticated
using (
  exists (
    select 1 from event_labs
    where event_labs.id = event_tracking.lab_id
      and event_labs.creator_id = auth.uid()
  )
);

-- 4) feedback_items
drop policy if exists "Anyone can submit feedback to active labs" on public.feedback_items;
drop policy if exists "Creators can update feedback for their labs" on public.feedback_items;
drop policy if exists "Creators can view all feedback for their labs" on public.feedback_items;
drop policy if exists "Participants can view their own feedback" on public.feedback_items;
drop policy if exists "Public can view top priority feedback" on public.feedback_items;
drop policy if exists "Users can update their own untriaged feedback" on public.feedback_items;

create policy "Authenticated can submit feedback to active labs"
on public.feedback_items
for insert
to authenticated
with check (
  exists (
    select 1 from event_labs
    where event_labs.id = feedback_items.lab_id
      and (event_labs.status)::text = 'active'::text
  )
);

create policy "Creators can update feedback for their labs"
on public.feedback_items
for update
to authenticated
using (
  exists (
    select 1 from event_labs
    where event_labs.id = feedback_items.lab_id
      and event_labs.creator_id = auth.uid()
  )
);

create policy "Creators can view all feedback for their labs"
on public.feedback_items
for select
to authenticated
using (
  exists (
    select 1 from event_labs
    where event_labs.id = feedback_items.lab_id
      and event_labs.creator_id = auth.uid()
  )
);

create policy "Participants can view their own feedback"
on public.feedback_items
for select
to authenticated
using (
  lab_user_id = auth.uid()
  or (session_id)::text in (
    select lab_sessions.id
    from lab_sessions
    where lab_sessions.lab_user_id = auth.uid()
  )
);

create policy "Authenticated can view top priority feedback"
on public.feedback_items
for select
to authenticated
using (
  (priority)::text = any (array['P0','P1']::text[])
  and trust_score >= 60
  and (status)::text = any (array['new','triaged']::text[])
);

create policy "Users can update their own untriaged feedback"
on public.feedback_items
for update
to authenticated
using (
  (
    lab_user_id = auth.uid()
    or (session_id)::text in (
      select lab_sessions.id
      from lab_sessions
      where lab_sessions.lab_user_id = auth.uid()
    )
  )
  and (status)::text = 'new'::text
)
with check ((status)::text = 'new'::text);

-- 5) lab_sessions
drop policy if exists "Anyone can manage sessions" on public.lab_sessions;
drop policy if exists "Anyone can update sessions" on public.lab_sessions;
drop policy if exists "Creators can view sessions for their labs" on public.lab_sessions;
drop policy if exists "Users can view their own sessions" on public.lab_sessions;

create policy "Users can create their own sessions"
on public.lab_sessions
for insert
to authenticated
with check (lab_user_id = auth.uid());

create policy "Users can update their own sessions"
on public.lab_sessions
for update
to authenticated
using (lab_user_id = auth.uid());

create policy "Creators can view sessions for their labs"
on public.lab_sessions
for select
to authenticated
using (
  exists (
    select 1 from event_labs
    where event_labs.id = lab_sessions.lab_id
      and event_labs.creator_id = auth.uid()
  )
);

create policy "Users can view their own sessions"
on public.lab_sessions
for select
to authenticated
using (lab_user_id = auth.uid());

-- 6) lab_login_events
create policy "Users can insert their own login events"
on public.lab_login_events
for insert
to authenticated
with check (lab_user_id = auth.uid());

create policy "Users can view their own login events"
on public.lab_login_events
for select
to authenticated
using (lab_user_id = auth.uid());

-- 7) lab_trust_metrics
create policy "Users can view their own trust metrics"
on public.lab_trust_metrics
for select
to authenticated
using (lab_user_id = auth.uid());

-- 8) lab_users
-- Assumption: lab_users.id matches auth.uid().
-- If this is not correct, tell me and I will adjust.
drop policy if exists "Allow service role full access" on public.lab_users;

create policy "Users can view their own profile"
on public.lab_users
for select
to authenticated
using (id = auth.uid());

create policy "Users can create their own profile"
on public.lab_users
for insert
to authenticated
with check (id = auth.uid());

create policy "Users can update their own profile"
on public.lab_users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- 9) spray_batches (tighten roles to authenticated)
drop policy if exists "Spray owners can delete batches" on public.spray_batches;
drop policy if exists "Spray owners can insert batches" on public.spray_batches;
drop policy if exists "Spray owners can update batches" on public.spray_batches;
drop policy if exists "Spray owners can view batches" on public.spray_batches;

create policy "Spray owners can view batches"
on public.spray_batches
for select
to authenticated
using (
  exists (
    select 1 from sprays
    where sprays.id = spray_batches.spray_id
      and sprays.lab_user_id = auth.uid()
  )
);

create policy "Spray owners can insert batches"
on public.spray_batches
for insert
to authenticated
with check (
  exists (
    select 1 from sprays
    where sprays.id = spray_batches.spray_id
      and sprays.lab_user_id = auth.uid()
  )
);

create policy "Spray owners can update batches"
on public.spray_batches
for update
to authenticated
using (
  exists (
    select 1 from sprays
    where sprays.id = spray_batches.spray_id
      and sprays.lab_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from sprays
    where sprays.id = spray_batches.spray_id
      and sprays.lab_user_id = auth.uid()
  )
);

create policy "Spray owners can delete batches"
on public.spray_batches
for delete
to authenticated
using (
  exists (
    select 1 from sprays
    where sprays.id = spray_batches.spray_id
      and sprays.lab_user_id = auth.uid()
  )
);

commit;
