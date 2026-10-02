begin;

-- ============================================================================

-- LIVEY V1

-- Crowd Status + Livey Wallet

--

-- Consumer/App Supabase project:

-- zocjbpddqeyzausehffs

--

-- Crowd Status rules:

-- - crowd is required

-- - queue is optional

-- - community reports require proximity verification before this RPC is called

-- - one accepted submission per user / venue every 20 minutes

-- - crowd lifetime: 45 minutes

-- - queue lifetime: 20 minutes

-- - one accepted submission = +1 Livey Point

-- - crowd + optional queue = one contribution / one reward

-- - trust weight = 1.0 for V1

-- - freshness decays linearly over the report lifetime

--

-- IMPORTANT:

-- Physical proximity verification remains in the submit-live-report

-- Edge Function. This migration owns persistence, cooldown, rewards,

-- aggregation and transactional integrity.

-- ============================================================================

-- ============================================================================

-- 1. RAW CROWD STATUS REPORTS

-- ============================================================================

create table if not exists public.venue_live_reports (

  id uuid primary key default gen_random_uuid(),

  venue_id uuid not null

    references public.venues(id)

    on delete cascade,

  report_type text not null

    check (

      report_type in (

        'crowd',

        'queue'

      )

    ),

  value text not null,

  source_type text not null

    check (

      source_type in (

        'community',

        'venue'

      )

    ),

  reporter_user_id uuid null,

  dashboard_account_id uuid null,

  proximity_verified boolean not null default false,

  created_at timestamptz not null default now(),

  expires_at timestamptz not null,

  constraint venue_live_reports_valid_value

  check (

    (

      report_type = 'crowd'

      and value in (

        'quiet',

        'comfortable',

        'busy',

        'packed'

      )

    )

    or

    (

      report_type = 'queue'

      and value in (

        'none',

        'short',

        'long'

      )

    )

  ),

  constraint venue_live_reports_valid_source

  check (

    (

      source_type = 'community'

      and reporter_user_id is not null

      and dashboard_account_id is null

      and proximity_verified = true

    )

    or

    (

      source_type = 'venue'

      and reporter_user_id is null

      and dashboard_account_id is not null

    )

  ),

  constraint venue_live_reports_valid_expiry

  check (

    expires_at > created_at

  )

);

create index if not exists

  venue_live_reports_venue_type_created_idx

on public.venue_live_reports (

  venue_id,

  report_type,

  created_at desc

);

create index if not exists

  venue_live_reports_expires_at_idx

on public.venue_live_reports (

  expires_at

);

create index if not exists

  venue_live_reports_reporter_created_idx

on public.venue_live_reports (

  reporter_user_id,

  created_at desc

)

where reporter_user_id is not null;

alter table public.venue_live_reports

enable row level security;

-- Raw Crowd Status reports are intentionally private.

--

-- Consumers should read only the aggregated venue_live_state table.

-- Trusted Edge Functions use service_role and bypass RLS.

revoke all

on table public.venue_live_reports

from anon;

revoke all

on table public.venue_live_reports

from authenticated;

-- ============================================================================

-- 2. PUBLIC AGGREGATED LIVE STATE

-- ============================================================================

create table if not exists public.venue_live_state (

  venue_id uuid primary key

    references public.venues(id)

    on delete cascade,

  crowd_state text null

    check (

      crowd_state is null

      or crowd_state in (

        'quiet',

        'comfortable',

        'busy',

        'packed'

      )

    ),

  crowd_confidence numeric(5,4) null

    check (

      crowd_confidence is null

      or (

        crowd_confidence >= 0

        and crowd_confidence <= 1

      )

    ),

  queue_state text null

    check (

      queue_state is null

      or queue_state in (

        'none',

        'short',

        'long'

      )

    ),

  queue_confidence numeric(5,4) null

    check (

      queue_confidence is null

      or (

        queue_confidence >= 0

        and queue_confidence <= 1

      )

    ),

  crowd_report_count integer not null default 0

    check (

      crowd_report_count >= 0

    ),

  queue_report_count integer not null default 0

    check (

      queue_report_count >= 0

    ),

  calculated_at timestamptz not null default now(),

  updated_at timestamptz not null default now()

);

alter table public.venue_live_state

enable row level security;

drop policy if exists

  "Public can read venue live state"

on public.venue_live_state;

create policy

  "Public can read venue live state"

on public.venue_live_state

for select

to anon, authenticated

using (true);

grant select

on table public.venue_live_state

to anon, authenticated;

revoke insert, update, delete

on table public.venue_live_state

from anon, authenticated;

-- ============================================================================

-- 3. LIVEY WALLET

-- ============================================================================

create table if not exists public.livey_wallets (

  user_id uuid primary key

    references auth.users(id)

    on delete cascade,

  points_balance integer not null default 0

    check (

      points_balance >= 0

    ),

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()

);

alter table public.livey_wallets

enable row level security;

drop policy if exists

  "Users can view their own Livey wallet"

on public.livey_wallets;

create policy

  "Users can view their own Livey wallet"

on public.livey_wallets

for select

to authenticated

using (

  auth.uid() = user_id

);

grant select

on table public.livey_wallets

to authenticated;

revoke insert, update, delete

on table public.livey_wallets

from anon, authenticated;

-- ============================================================================

-- 4. IMMUTABLE LIVEY POINT TRANSACTION LEDGER

-- ============================================================================

create table if not exists public.livey_point_transactions (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null

    references auth.users(id)

    on delete cascade,

  amount integer not null

    check (

      amount <> 0

    ),

  transaction_type text not null

    check (

      transaction_type in (

        'earn',

        'spend',

        'adjustment'

      )

    ),

  source_type text not null,

  source_id uuid null,

  venue_id uuid null

    references public.venues(id)

    on delete set null,

  description text null,

  created_at timestamptz not null default now()

);

create unique index if not exists

  livey_point_transactions_unique_crowd_reward

on public.livey_point_transactions (

  source_id

)

where

  transaction_type = 'earn'

  and source_type = 'crowd_status'

  and source_id is not null;

create index if not exists

  livey_point_transactions_user_created_idx

on public.livey_point_transactions (

  user_id,

  created_at desc

);

create index if not exists

  livey_point_transactions_venue_idx

on public.livey_point_transactions (

  venue_id,

  created_at desc

)

where venue_id is not null;

alter table public.livey_point_transactions

enable row level security;

drop policy if exists

  "Users can view their own Livey point transactions"

on public.livey_point_transactions;

create policy

  "Users can view their own Livey point transactions"

on public.livey_point_transactions

for select

to authenticated

using (

  auth.uid() = user_id

);

grant select

on table public.livey_point_transactions

to authenticated;

revoke insert, update, delete

on table public.livey_point_transactions

from anon, authenticated;

-- ============================================================================

-- 5. IMMUTABLE LEDGER PROTECTION

-- ============================================================================

create or replace function public.prevent_livey_point_transaction_mutation()

returns trigger

language plpgsql

set search_path = public

as $$

begin

  raise exception

    'Livey point transactions are immutable.';

end;

$$;

revoke all

on function public.prevent_livey_point_transaction_mutation()

from public;

drop trigger if exists

  prevent_livey_point_transaction_update

on public.livey_point_transactions;

create trigger

  prevent_livey_point_transaction_update

before update

on public.livey_point_transactions

for each row

execute function

  public.prevent_livey_point_transaction_mutation();

drop trigger if exists

  prevent_livey_point_transaction_delete

on public.livey_point_transactions;

create trigger

  prevent_livey_point_transaction_delete

before delete

on public.livey_point_transactions

for each row

execute function

  public.prevent_livey_point_transaction_mutation();

-- ============================================================================

-- 6. ATOMIC CROWD STATUS SUBMISSION RPC

-- ============================================================================

--

-- This function is deliberately callable only by service_role.

--

-- The submit-live-report Edge Function:

--

-- 1. authenticates the consumer

-- 2. validates request shape

-- 3. validates GPS accuracy

-- 4. loads venue coordinates server-side

-- 5. verifies the supplied foreground position is <= 150m away

-- 6. calls this RPC with the authenticated user's UUID

--

-- Everything below occurs inside one PostgreSQL transaction.

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

  -- Validate input

  -- --------------------------------------------------------------------------

  if p_user_id is null then

    raise exception

      'User ID is required.';

  end if;

  if p_venue_id is null then

    raise exception

      'Venue ID is required.';

  end if;

  if p_crowd not in (

    'quiet',

    'comfortable',

    'busy',

    'packed'

  ) then

    raise exception

      'Invalid crowd value.';

  end if;

  if p_queue is not null

     and p_queue not in (

       'none',

       'short',

       'long'

     ) then

    raise exception

      'Invalid queue value.';

  end if;

  -- --------------------------------------------------------------------------

  -- Verify authenticated user still exists

  -- --------------------------------------------------------------------------

  if not exists (

    select 1

    from auth.users u

    where u.id = p_user_id

  ) then

    raise exception

      'Authenticated user does not exist.';

  end if;

  -- --------------------------------------------------------------------------

  -- Verify venue is eligible

  -- --------------------------------------------------------------------------

  if not exists (

    select 1

    from public.venues v

    where v.id = p_venue_id

      and v.is_active = true

      and v.approval_status = 'approved'

  ) then

    raise exception

      'Venue is not available for Crowd Status.';

  end if;

  -- --------------------------------------------------------------------------

  -- Transaction-scoped concurrency lock

  --

  -- Only one submission for this user + venue may pass through this section

  -- at a time.

  --

  -- This prevents simultaneous requests from both passing the cooldown check

  -- and earning duplicate points.

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

  -- 20-minute accepted submission cooldown

  --

  -- Crowd is required for every Crowd Status submission, therefore the latest

  -- community crowd report is the authoritative submission timestamp.

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

  -- Expire previous active crowd opinion

  -- --------------------------------------------------------------------------

  update public.venue_live_reports r

  set expires_at =

    greatest(

      v_now,

      r.created_at

        + interval '1 millisecond'

    )

  where r.venue_id = p_venue_id

    and r.reporter_user_id = p_user_id

    and r.source_type = 'community'

    and r.report_type = 'crowd'

    and r.expires_at > v_now;

  -- --------------------------------------------------------------------------

  -- If queue was explicitly supplied, replace the user's previous active

  -- queue opinion.

  --

  -- If queue is omitted, the previous queue opinion naturally remains active

  -- until its normal expiry.

  -- --------------------------------------------------------------------------

  if p_queue is not null then

    update public.venue_live_reports r

    set expires_at =

      greatest(

        v_now,

        r.created_at

          + interval '1 millisecond'

      )

    where r.venue_id = p_venue_id

      and r.reporter_user_id = p_user_id

      and r.source_type = 'community'

      and r.report_type = 'queue'

      and r.expires_at > v_now;

  end if;

  -- --------------------------------------------------------------------------

  -- Insert required crowd report

  --

  -- Crowd lifetime: 45 minutes

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

  -- Insert optional queue report

  --

  -- Queue lifetime: 20 minutes

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

  -- Create one +1 Livey Point ledger transaction

  --

  -- The required crowd report is the unique reward source.

  --

  -- Therefore:

  --

  -- crowd only

  --     = one submission

  --     = one point

  --

  -- crowd + queue

  --     = one submission

  --     = one point

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

  -- --------------------------------------------------------------------------

  -- Create or increment wallet

  -- --------------------------------------------------------------------------

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

  -- ==========================================================================

  -- CROWD AGGREGATION

  -- ==========================================================================

  --

  -- V1:

  --

  -- trust_weight = 1.0

  --

  -- freshness_weight =

  --

  --   remaining report lifetime

  --   -------------------------

  --   original report lifetime

  --

  -- final_weight =

  --

  --   trust_weight

  --   *

  --   freshness_weight

  --

  -- Older reports therefore continuously lose influence until they reach zero.

  -- ==========================================================================

  with weighted as (

    select

      r.value,

      greatest(

        0::numeric,

        least(

          1::numeric,

          (

            extract(

              epoch from (

                r.expires_at - v_now

              )

            )

            /

            nullif(

              extract(

                epoch from (

                  r.expires_at

                  - r.created_at

                )

              ),

              0

            )

          )::numeric

        )

      ) as weight,

      r.created_at

    from public.venue_live_reports r

    where r.venue_id = p_venue_id

      and r.report_type = 'crowd'

      and r.expires_at > v_now

  ),

  grouped as (

    select

      value,

      sum(weight)

        as total_weight,

      max(created_at)

        as newest_report

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

      then

        w.total_weight

        /

        t.all_weight

      else null

    end,

    (

      select

        count(*)::integer

      from public.venue_live_reports r

      where r.venue_id = p_venue_id

        and r.report_type = 'crowd'

        and r.expires_at > v_now

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

  -- QUEUE AGGREGATION

  -- ==========================================================================

  with weighted as (

    select

      r.value,

      greatest(

        0::numeric,

        least(

          1::numeric,

          (

            extract(

              epoch from (

                r.expires_at - v_now

              )

            )

            /

            nullif(

              extract(

                epoch from (

                  r.expires_at

                  - r.created_at

                )

              ),

              0

            )

          )::numeric

        )

      ) as weight,

      r.created_at

    from public.venue_live_reports r

    where r.venue_id = p_venue_id

      and r.report_type = 'queue'

      and r.expires_at > v_now

  ),

  grouped as (

    select

      value,

      sum(weight)

        as total_weight,

      max(created_at)

        as newest_report

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

      then

        w.total_weight

        /

        t.all_weight

      else null

    end,

    (

      select

        count(*)::integer

      from public.venue_live_reports r

      where r.venue_id = p_venue_id

        and r.report_type = 'queue'

        and r.expires_at > v_now

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

  -- UPDATE PUBLIC AGGREGATED STATE

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

    v_now,

    v_now

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

  -- ==========================================================================

  -- SUCCESS

  -- ==========================================================================

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

-- ============================================================================

-- 7. RPC SECURITY

-- ============================================================================

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

-- 8. REMOVE LEGACY STANDALONE REWARD RPC

-- ============================================================================

--

-- Crowd Status points must never be awarded separately from the accepted

-- Crowd Status transaction.

--

-- submit_crowd_status_atomic() is now the only reward path.

-- ============================================================================

drop function if exists

  public.award_crowd_status_point(

    uuid,

    uuid,

    uuid

  );

commit;
