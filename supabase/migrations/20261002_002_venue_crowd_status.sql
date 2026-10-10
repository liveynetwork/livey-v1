begin;

-- ============================================================================
-- LIVEY V1
-- Venue-owner Crowd Status
--
-- Consumer/App Supabase project:
-- zocjbpddqeyzausehffs
--
-- Adds:
-- - shared Crowd Status aggregation
-- - community weight 1.0
-- - venue weight 1.5
-- - venue-owner atomic Crowd Status RPC
-- - 2-minute venue update cooldown
-- - no Livey Points for venue submissions
--
-- Existing community rules remain:
-- - 20-minute user / venue cooldown
-- - crowd lifetime 45 minutes
-- - queue lifetime 20 minutes
-- - +1 Livey Point per accepted community submission
-- ============================================================================


-- ============================================================================
-- 1. SHARED LIVE-STATE AGGREGATION
-- ============================================================================

create or replace function public.recalculate_venue_live_state(
  p_venue_id uuid,
  p_now timestamptz default now()
)
returns table (
  crowd_state text,
  crowd_confidence numeric,
  crowd_report_count integer,
  queue_state text,
  queue_confidence numeric,
  queue_report_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_crowd_state text;
  v_crowd_confidence numeric;
  v_crowd_count integer := 0;

  v_queue_state text;
  v_queue_confidence numeric;
  v_queue_count integer := 0;
begin
  if p_venue_id is null then
    raise exception 'Venue ID is required.';
  end if;

  -- One aggregation calculation per venue at a time.
  perform pg_advisory_xact_lock(
    hashtextextended(
      'live-state:' || p_venue_id::text,
      0
    )
  );


  -- ==========================================================================
  -- CROWD
  -- ==========================================================================

  with weighted as (
    select
      r.value,

      (
        case
          when r.source_type = 'venue'
            then 1.5::numeric
          else 1.0::numeric
        end
        *
        greatest(
          0::numeric,
          least(
            1::numeric,
            (
              extract(
                epoch from (
                  r.expires_at - p_now
                )
              )
              /
              nullif(
                extract(
                  epoch from (
                    r.expires_at - r.created_at
                  )
                ),
                0
              )
            )::numeric
          )
        )
      ) as weight,

      r.created_at

    from public.venue_live_reports r

    where r.venue_id = p_venue_id
      and r.report_type = 'crowd'
      and r.expires_at > p_now
  ),

  grouped as (
    select
      value,
      sum(weight) as total_weight,
      max(created_at) as newest_report

    from weighted

    where weight > 0

    group by value
  ),

  totals as (
    select
      coalesce(
        sum(total_weight),
        0
      ) as all_weight

    from grouped
  ),

  winner as (
    select
      g.value,
      g.total_weight

    from grouped g

    order by
      g.total_weight desc,
      g.newest_report desc,
      g.value

    limit 1
  )

  select
    w.value,

    case
      when t.all_weight > 0
        then w.total_weight / t.all_weight
      else null
    end,

    (
      select count(*)::integer

      from public.venue_live_reports r

      where r.venue_id = p_venue_id
        and r.report_type = 'crowd'
        and r.expires_at > p_now
    )

  into
    v_crowd_state,
    v_crowd_confidence,
    v_crowd_count

  from winner w
  cross join totals t;


  if v_crowd_state is null then
    v_crowd_confidence := null;
    v_crowd_count := 0;
  end if;


  -- ==========================================================================
  -- QUEUE
  -- ==========================================================================

  with weighted as (
    select
      r.value,

      (
        case
          when r.source_type = 'venue'
            then 1.5::numeric
          else 1.0::numeric
        end
        *
        greatest(
          0::numeric,
          least(
            1::numeric,
            (
              extract(
                epoch from (
                  r.expires_at - p_now
                )
              )
              /
              nullif(
                extract(
                  epoch from (
                    r.expires_at - r.created_at
                  )
                ),
                0
              )
            )::numeric
          )
        )
      ) as weight,

      r.created_at

    from public.venue_live_reports r

    where r.venue_id = p_venue_id
      and r.report_type = 'queue'
      and r.expires_at > p_now
  ),

  grouped as (
    select
      value,
      sum(weight) as total_weight,
      max(created_at) as newest_report

    from weighted

    where weight > 0

    group by value
  ),

  totals as (
    select
      coalesce(
        sum(total_weight),
        0
      ) as all_weight

    from grouped
  ),

  winner as (
    select
      g.value,
      g.total_weight

    from grouped g

    order by
      g.total_weight desc,
      g.newest_report desc,
      g.value

    limit 1
  )

  select
    w.value,

    case
      when t.all_weight > 0
        then w.total_weight / t.all_weight
      else null
    end,

    (
      select count(*)::integer

      from public.venue_live_reports r

      where r.venue_id = p_venue_id
        and r.report_type = 'queue'
        and r.expires_at > p_now
    )

  into
    v_queue_state,
    v_queue_confidence,
    v_queue_count

  from winner w
  cross join totals t;


  if v_queue_state is null then
    v_queue_confidence := null;
    v_queue_count := 0;
  end if;


  -- ==========================================================================
  -- PERSIST PUBLIC AGGREGATE
  -- ==========================================================================

  insert into public.venue_live_state (
    venue_id,

    crowd_state,
    crowd_confidence,
    crowd_report_count,

    queue_state,
    queue_confidence,
    queue_report_count,

    calculated_at,
    updated_at
  )
  values (
    p_venue_id,

    v_crowd_state,
    v_crowd_confidence,
    v_crowd_count,

    v_queue_state,
    v_queue_confidence,
    v_queue_count,

    p_now,
    p_now
  )
  on conflict (venue_id)
  do update set
    crowd_state =
      excluded.crowd_state,

    crowd_confidence =
      excluded.crowd_confidence,

    crowd_report_count =
      excluded.crowd_report_count,

    queue_state =
      excluded.queue_state,

    queue_confidence =
      excluded.queue_confidence,

    queue_report_count =
      excluded.queue_report_count,

    calculated_at =
      excluded.calculated_at,

    updated_at =
      excluded.updated_at;


  return query
  select
    v_crowd_state,
    v_crowd_confidence,
    v_crowd_count,

    v_queue_state,
    v_queue_confidence,
    v_queue_count;
end;
$$;


revoke all
on function public.recalculate_venue_live_state(
  uuid,
  timestamptz
)
from public;


revoke all
on function public.recalculate_venue_live_state(
  uuid,
  timestamptz
)
from anon;


revoke all
on function public.recalculate_venue_live_state(
  uuid,
  timestamptz
)
from authenticated;


grant execute
on function public.recalculate_venue_live_state(
  uuid,
  timestamptz
)
to service_role;


-- ============================================================================
-- 2. COMMUNITY CROWD STATUS RPC
--
-- Existing API contract remains unchanged.
-- Aggregation is now delegated to the shared weighted aggregator above.
-- ============================================================================

create or replace function public.submit_crowd_status_atomic(
  p_user_id uuid,
  p_venue_id uuid,
  p_crowd text,
  p_queue text default null
)
returns table (
  accepted boolean,
  reason text,

  crowd_report_id uuid,
  queue_report_id uuid,

  crowd_state text,
  crowd_confidence numeric,
  crowd_report_count integer,

  queue_state text,
  queue_confidence numeric,
  queue_report_count integer,

  points_awarded integer,
  new_balance integer,

  next_submission_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();

  v_previous_submission timestamptz;

  v_crowd_report_id uuid;
  v_queue_report_id uuid;

  v_crowd_state text;
  v_crowd_confidence numeric;
  v_crowd_count integer := 0;

  v_queue_state text;
  v_queue_confidence numeric;
  v_queue_count integer := 0;

  v_balance integer := 0;
begin
  -- --------------------------------------------------------------------------
  -- Validation
  -- --------------------------------------------------------------------------

  if p_user_id is null then
    raise exception 'User ID is required.';
  end if;


  if p_venue_id is null then
    raise exception 'Venue ID is required.';
  end if;


  if p_crowd not in (
    'quiet',
    'comfortable',
    'busy',
    'packed'
  ) then
    raise exception 'Invalid crowd value.';
  end if;


  if p_queue is not null
     and p_queue not in (
       'none',
       'short',
       'long'
     ) then
    raise exception 'Invalid queue value.';
  end if;


  if not exists (
    select 1
    from auth.users u
    where u.id = p_user_id
  ) then
    raise exception 'Authenticated user does not exist.';
  end if;


  if not exists (
    select 1
    from public.venues v
    where v.id = p_venue_id
      and v.is_active = true
      and v.approval_status = 'approved'
  ) then
    raise exception 'Venue is not available for Crowd Status.';
  end if;


  -- --------------------------------------------------------------------------
  -- Serialize this user + venue combination.
  -- --------------------------------------------------------------------------

  perform pg_advisory_xact_lock(
    hashtextextended(
      p_user_id::text
        || ':'
        || p_venue_id::text,
      0
    )
  );


  -- --------------------------------------------------------------------------
  -- 20-minute community cooldown.
  -- --------------------------------------------------------------------------

  select max(r.created_at)
  into v_previous_submission

  from public.venue_live_reports r

  where r.venue_id = p_venue_id
    and r.reporter_user_id = p_user_id
    and r.source_type = 'community'
    and r.report_type = 'crowd'
    and r.created_at >
      v_now - interval '20 minutes';


  if v_previous_submission is not null then
    return query
    select
      false,
      'cooldown',

      null::uuid,
      null::uuid,

      null::text,
      null::numeric,
      0,

      null::text,
      null::numeric,
      0,

      0,

      coalesce(
        (
          select w.points_balance

          from public.livey_wallets w

          where w.user_id = p_user_id
        ),
        0
      ),

      v_previous_submission
        + interval '20 minutes';

    return;
  end if;


  -- --------------------------------------------------------------------------
  -- Replace previous community crowd opinion.
  -- --------------------------------------------------------------------------

  update public.venue_live_reports r

  set expires_at =
    greatest(
      v_now,
      r.created_at + interval '1 millisecond'
    )

  where r.venue_id = p_venue_id
    and r.reporter_user_id = p_user_id
    and r.source_type = 'community'
    and r.report_type = 'crowd'
    and r.expires_at > v_now;


  -- --------------------------------------------------------------------------
  -- Queue is replaced only when explicitly supplied.
  -- --------------------------------------------------------------------------

  if p_queue is not null then

    update public.venue_live_reports r

    set expires_at =
      greatest(
        v_now,
        r.created_at + interval '1 millisecond'
      )

    where r.venue_id = p_venue_id
      and r.reporter_user_id = p_user_id
      and r.source_type = 'community'
      and r.report_type = 'queue'
      and r.expires_at > v_now;

  end if;


  -- --------------------------------------------------------------------------
  -- Crowd report: 45-minute lifetime.
  -- --------------------------------------------------------------------------

  insert into public.venue_live_reports (
    venue_id,
    report_type,
    value,
    source_type,
    reporter_user_id,
    dashboard_account_id,
    proximity_verified,
    created_at,
    expires_at
  )
  values (
    p_venue_id,
    'crowd',
    p_crowd,
    'community',
    p_user_id,
    null,
    true,
    v_now,
    v_now + interval '45 minutes'
  )
  returning id
  into v_crowd_report_id;


  -- --------------------------------------------------------------------------
  -- Optional queue report: 20-minute lifetime.
  -- --------------------------------------------------------------------------

  if p_queue is not null then

    insert into public.venue_live_reports (
      venue_id,
      report_type,
      value,
      source_type,
      reporter_user_id,
      dashboard_account_id,
      proximity_verified,
      created_at,
      expires_at
    )
    values (
      p_venue_id,
      'queue',
      p_queue,
      'community',
      p_user_id,
      null,
      true,
      v_now,
      v_now + interval '20 minutes'
    )
    returning id
    into v_queue_report_id;

  end if;


  -- --------------------------------------------------------------------------
  -- Exactly one Livey Point per accepted community submission.
  -- --------------------------------------------------------------------------

  insert into public.livey_point_transactions (
    user_id,
    amount,
    transaction_type,
    source_type,
    source_id,
    venue_id,
    description,
    created_at
  )
  values (
    p_user_id,
    1,
    'earn',
    'crowd_status',
    v_crowd_report_id,
    p_venue_id,
    'Crowd Status contribution',
    v_now
  );


  insert into public.livey_wallets (
    user_id,
    points_balance,
    created_at,
    updated_at
  )
  values (
    p_user_id,
    1,
    v_now,
    v_now
  )
  on conflict (user_id)
  do update set
    points_balance =
      public.livey_wallets.points_balance + 1,

    updated_at =
      v_now

  returning points_balance
  into v_balance;


  -- --------------------------------------------------------------------------
  -- Shared weighted aggregation.
  -- --------------------------------------------------------------------------

  select
    s.crowd_state,
    s.crowd_confidence,
    s.crowd_report_count,

    s.queue_state,
    s.queue_confidence,
    s.queue_report_count

  into
    v_crowd_state,
    v_crowd_confidence,
    v_crowd_count,

    v_queue_state,
    v_queue_confidence,
    v_queue_count

  from public.recalculate_venue_live_state(
    p_venue_id,
    v_now
  ) s;


  return query
  select
    true,
    null::text,

    v_crowd_report_id,
    v_queue_report_id,

    v_crowd_state,
    v_crowd_confidence,
    v_crowd_count,

    v_queue_state,
    v_queue_confidence,
    v_queue_count,

    1,
    v_balance,

    v_now + interval '20 minutes';
end;
$$;


revoke all
on function public.submit_crowd_status_atomic(
  uuid,
  uuid,
  text,
  text
)
from public;


revoke all
on function public.submit_crowd_status_atomic(
  uuid,
  uuid,
  text,
  text
)
from anon;


revoke all
on function public.submit_crowd_status_atomic(
  uuid,
  uuid,
  text,
  text
)
from authenticated;


grant execute
on function public.submit_crowd_status_atomic(
  uuid,
  uuid,
  text,
  text
)
to service_role;


-- ============================================================================
-- 3. VENUE-OWNER ATOMIC CROWD STATUS RPC
--
-- This is a trusted service-role endpoint.
--
-- Dashboard authentication and venue ownership are verified before this
-- function is called through the Dashboard -> Consumer bridge.
--
-- Venue reports:
-- - require no GPS
-- - award no Livey Points
-- - crowd expires after 45 minutes
-- - queue expires after 20 minutes
-- - venue submission cooldown is 2 minutes
-- ============================================================================

create or replace function public.submit_venue_crowd_status_atomic(
  p_dashboard_account_id uuid,
  p_venue_id uuid,
  p_crowd text,
  p_queue text default null
)
returns table (
  accepted boolean,
  reason text,

  crowd_report_id uuid,
  queue_report_id uuid,

  crowd_state text,
  crowd_confidence numeric,
  crowd_report_count integer,

  queue_state text,
  queue_confidence numeric,
  queue_report_count integer,

  points_awarded integer,

  next_submission_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();

  v_previous_submission timestamptz;

  v_crowd_report_id uuid;
  v_queue_report_id uuid;

  v_crowd_state text;
  v_crowd_confidence numeric;
  v_crowd_count integer := 0;

  v_queue_state text;
  v_queue_confidence numeric;
  v_queue_count integer := 0;
begin
  -- --------------------------------------------------------------------------
  -- Validation
  -- --------------------------------------------------------------------------

  if p_dashboard_account_id is null then
    raise exception 'Dashboard account ID is required.';
  end if;


  if p_venue_id is null then
    raise exception 'Venue ID is required.';
  end if;


  if p_crowd not in (
    'quiet',
    'comfortable',
    'busy',
    'packed'
  ) then
    raise exception 'Invalid crowd value.';
  end if;


  if p_queue is not null
     and p_queue not in (
       'none',
       'short',
       'long'
     ) then
    raise exception 'Invalid queue value.';
  end if;


  if not exists (
    select 1
    from public.venues v
    where v.id = p_venue_id
      and v.is_active = true
      and v.approval_status = 'approved'
  ) then
    raise exception 'Venue is not available for Crowd Status.';
  end if;


  -- --------------------------------------------------------------------------
  -- One venue-owner Crowd Status transaction per venue at a time.
  -- --------------------------------------------------------------------------

  perform pg_advisory_xact_lock(
    hashtextextended(
      'venue-status:' || p_venue_id::text,
      0
    )
  );


  -- --------------------------------------------------------------------------
  -- 2-minute venue cooldown.
  --
  -- Crowd is mandatory, therefore the latest venue crowd report represents
  -- the latest accepted venue Crowd Status submission.
  -- --------------------------------------------------------------------------

  select max(r.created_at)
  into v_previous_submission

  from public.venue_live_reports r

  where r.venue_id = p_venue_id
    and r.source_type = 'venue'
    and r.report_type = 'crowd'
    and r.created_at >
      v_now - interval '2 minutes';


  if v_previous_submission is not null then
    return query
    select
      false,
      'cooldown',

      null::uuid,
      null::uuid,

      null::text,
      null::numeric,
      0,

      null::text,
      null::numeric,
      0,

      0,

      v_previous_submission
        + interval '2 minutes';

    return;
  end if;


  -- --------------------------------------------------------------------------
  -- Only one active venue crowd signal per venue.
  -- --------------------------------------------------------------------------

  update public.venue_live_reports r

  set expires_at =
    greatest(
      v_now,
      r.created_at + interval '1 millisecond'
    )

  where r.venue_id = p_venue_id
    and r.source_type = 'venue'
    and r.report_type = 'crowd'
    and r.expires_at > v_now;


  -- --------------------------------------------------------------------------
  -- Queue is replaced only when explicitly supplied.
  -- --------------------------------------------------------------------------

  if p_queue is not null then

    update public.venue_live_reports r

    set expires_at =
      greatest(
        v_now,
        r.created_at + interval '1 millisecond'
      )

    where r.venue_id = p_venue_id
      and r.source_type = 'venue'
      and r.report_type = 'queue'
      and r.expires_at > v_now;

  end if;


  -- --------------------------------------------------------------------------
  -- Insert venue crowd report.
  -- --------------------------------------------------------------------------

  insert into public.venue_live_reports (
    venue_id,
    report_type,
    value,
    source_type,
    reporter_user_id,
    dashboard_account_id,
    proximity_verified,
    created_at,
    expires_at
  )
  values (
    p_venue_id,
    'crowd',
    p_crowd,
    'venue',
    null,
    p_dashboard_account_id,
    false,
    v_now,
    v_now + interval '45 minutes'
  )
  returning id
  into v_crowd_report_id;


  -- --------------------------------------------------------------------------
  -- Insert optional venue queue report.
  -- --------------------------------------------------------------------------

  if p_queue is not null then

    insert into public.venue_live_reports (
      venue_id,
      report_type,
      value,
      source_type,
      reporter_user_id,
      dashboard_account_id,
      proximity_verified,
      created_at,
      expires_at
    )
    values (
      p_venue_id,
      'queue',
      p_queue,
      'venue',
      null,
      p_dashboard_account_id,
      false,
      v_now,
      v_now + interval '20 minutes'
    )
    returning id
    into v_queue_report_id;

  end if;


  -- --------------------------------------------------------------------------
  -- Venue reports receive NO points.
  -- --------------------------------------------------------------------------


  -- --------------------------------------------------------------------------
  -- Shared weighted aggregation.
  -- --------------------------------------------------------------------------

  select
    s.crowd_state,
    s.crowd_confidence,
    s.crowd_report_count,

    s.queue_state,
    s.queue_confidence,
    s.queue_report_count

  into
    v_crowd_state,
    v_crowd_confidence,
    v_crowd_count,

    v_queue_state,
    v_queue_confidence,
    v_queue_count

  from public.recalculate_venue_live_state(
    p_venue_id,
    v_now
  ) s;


  return query
  select
    true,
    null::text,

    v_crowd_report_id,
    v_queue_report_id,

    v_crowd_state,
    v_crowd_confidence,
    v_crowd_count,

    v_queue_state,
    v_queue_confidence,
    v_queue_count,

    0,

    v_now + interval '2 minutes';
end;
$$;


-- ============================================================================
-- 4. VENUE-OWNER RPC SECURITY
-- ============================================================================

revoke all
on function public.submit_venue_crowd_status_atomic(
  uuid,
  uuid,
  text,
  text
)
from public;


revoke all
on function public.submit_venue_crowd_status_atomic(
  uuid,
  uuid,
  text,
  text
)
from anon;


revoke all
on function public.submit_venue_crowd_status_atomic(
  uuid,
  uuid,
  text,
  text
)
from authenticated;


grant execute
on function public.submit_venue_crowd_status_atomic(
  uuid,
  uuid,
  text,
  text
)
to service_role;


commit;