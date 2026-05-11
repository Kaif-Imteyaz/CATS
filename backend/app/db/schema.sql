create extension if not exists "pgcrypto";

-- drop existing
drop table if exists pain_logs             cascade;
drop table if exists sessions              cascade;
drop table if exists patient_rom_overrides cascade;
drop table if exists messages              cascade;
drop table if exists scheduled_sessions    cascade;
drop table if exists physio_patients       cascade;
drop table if exists reports               cascade;
drop table if exists exercise_videos       cascade;
drop table if exists plans                 cascade;
drop table if exists profiles              cascade;

-- profiles
create table profiles (
  id                uuid references auth.users primary key,
  patient_code      text unique,
  name              text not null,
  role              text not null check (role in ('patient', 'physio')),
  sex               text check (sex in ('male', 'female', 'other')),
  age               integer check (age > 0 and age < 130),
  dob               date,
  region            text default '',
  region_updated_at timestamptz,
  pain_areas        text[] default '{}',
  lang              text default 'en' check (lang in ('en', 'hi', 'ur')),
  culture_mode      text default 'standard',
  voice_persona     text default 'april' check (voice_persona in ('april', 'kai')),
  created_at        timestamptz default now()
);

-- plans
create table plans (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references profiles(id) on delete cascade,
  physio_id      uuid references profiles(id) on delete set null,
  pain_areas     text[] default '{}',
  mobility_level text,
  exercises      jsonb default '[]',
  ai_notes       text default '',
  ai_goals       text[] default '{}',
  physio_notes   text default '',
  active         boolean default true,
  created_at     timestamptz default now(),
  constraint plans_patient_ne_physio check (physio_id is null or patient_id != physio_id)
);

-- sessions
create table sessions (
  id               uuid primary key default gen_random_uuid(),
  patient_id       uuid not null references profiles(id) on delete cascade,
  plan_id          uuid references plans(id) on delete set null,
  exercise_tag     text not null,
  reps             integer default 0 check (reps >= 0),
  score            numeric(5,2) default 0 check (score >= 0 and score <= 100),
  posture_data     jsonb default '{}',
  duration_seconds integer default 0 check (duration_seconds >= 0),
  completed_at     timestamptz default now()
);

-- pain logs
create table pain_logs (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  session_id uuid references sessions(id) on delete set null,
  level      integer not null check (level >= 0 and level <= 10),
  note       text default '',
  logged_at  timestamptz default now()
);

-- reports
create table reports (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references profiles(id) on delete cascade,
  physio_id  uuid references profiles(id) on delete set null,
  week_start date not null,
  summary    jsonb default '{}',
  created_at timestamptz default now(),
  unique (patient_id, week_start)
);

-- rom overrides
create table patient_rom_overrides (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null references profiles(id) on delete cascade,
  physio_id    uuid references profiles(id) on delete set null,
  exercise_tag text not null,
  rom_min      integer not null check (rom_min >= 0 and rom_min <= 180),
  rom_max      integer not null check (rom_max >= 0 and rom_max <= 180),
  reps         integer default null check (reps is null or (reps > 0 and reps <= 50)),
  updated_at   timestamptz default now(),
  unique (patient_id, exercise_tag)
);

-- physio patients
create table physio_patients (
  physio_id  uuid not null references profiles(id) on delete cascade,
  patient_id uuid not null references profiles(id) on delete cascade,
  linked_at  timestamptz default now(),
  primary key (physio_id, patient_id)
);

-- exercise videos
create table exercise_videos (
  id         uuid primary key default gen_random_uuid(),
  pain_area  text not null,
  age_min    integer not null check (age_min >= 0),
  age_max    integer not null check (age_max >= 0),
  title      text not null,
  url        text default '',
  source     text not null default 'ai' check (source in ('ai', 'physio')),
  physio_id  uuid references profiles(id) on delete set null,
  status     text not null default 'pending' check (status in ('pending', 'ready', 'error')),
  created_at timestamptz default now()
);

-- messages
create table messages (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references profiles(id) on delete cascade,
  physio_id   uuid not null references profiles(id) on delete cascade,
  sender_role text not null check (sender_role in ('patient', 'physio')),
  content     text not null,
  read        boolean default false,
  created_at  timestamptz default now()
);

-- scheduled sessions
create table scheduled_sessions (
  id         uuid primary key default gen_random_uuid(),
  physio_id  uuid not null references profiles(id) on delete cascade,
  patient_id uuid not null references profiles(id) on delete cascade,
  datetime   timestamptz not null,
  type       text not null check (type in ('video', 'in-person', 'phone')),
  status     text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  room_code  text,
  notes      text default '',
  created_at timestamptz default now()
);

-- indexes
create index plans_patient_id_idx            on plans(patient_id);
create index plans_physio_id_idx             on plans(physio_id);
create index plans_active_idx                on plans(active) where active = true;

create index sessions_patient_id_idx         on sessions(patient_id);
create index sessions_plan_id_idx            on sessions(plan_id);
create index sessions_completed_at_idx       on sessions(completed_at desc);
create index sessions_exercise_tag_idx       on sessions(exercise_tag);

create index pain_logs_patient_id_idx        on pain_logs(patient_id);
create index pain_logs_logged_at_idx         on pain_logs(logged_at desc);

create index reports_patient_id_idx          on reports(patient_id);

create index physio_patients_physio_idx      on physio_patients(physio_id);
create index physio_patients_patient_idx     on physio_patients(patient_id);

create index exercise_videos_pain_area_idx   on exercise_videos(pain_area);
create index exercise_videos_status_idx      on exercise_videos(status);
create index exercise_videos_physio_idx      on exercise_videos(physio_id);

create index messages_patient_id_idx         on messages(patient_id);
create index messages_physio_id_idx          on messages(physio_id);
create index messages_created_at_idx         on messages(created_at desc);

create index scheduled_sessions_physio_idx   on scheduled_sessions(physio_id);
create index scheduled_sessions_patient_idx  on scheduled_sessions(patient_id);
create index scheduled_sessions_datetime_idx on scheduled_sessions(datetime);

-- row level security
alter table profiles              enable row level security;
alter table plans                 enable row level security;
alter table sessions              enable row level security;
alter table pain_logs             enable row level security;
alter table reports               enable row level security;
alter table patient_rom_overrides enable row level security;
alter table physio_patients       enable row level security;
alter table exercise_videos       enable row level security;
alter table messages              enable row level security;
alter table scheduled_sessions    enable row level security;

-- profiles policies
create policy "profiles: own full access"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: authenticated read"
  on profiles for select
  using (auth.uid() is not null);

-- plans policies
create policy "plans: patient read own"
  on plans for select
  using (auth.uid() = patient_id);

create policy "plans: patient insert own"
  on plans for insert
  with check (auth.uid() = patient_id);

create policy "plans: patient update own"
  on plans for update
  using (auth.uid() = patient_id)
  with check (auth.uid() = patient_id);

create policy "plans: physio full access"
  on plans for all
  using (auth.uid() = physio_id);

create policy "plans: physio read linked patients"
  on plans for select
  using (
    exists (
      select 1 from physio_patients
      where physio_patients.physio_id = auth.uid()
        and physio_patients.patient_id = plans.patient_id
    )
  );

create policy "plans: physio update linked patients"
  on plans for update
  using (
    exists (
      select 1 from physio_patients
      where physio_patients.physio_id = auth.uid()
        and physio_patients.patient_id = plans.patient_id
    )
  )
  with check (auth.uid() = physio_id);

-- sessions policies
create policy "sessions: patient full access"
  on sessions for all
  using (auth.uid() = patient_id);

create policy "sessions: physio read linked patients"
  on sessions for select
  using (
    exists (
      select 1 from physio_patients
      where physio_patients.physio_id = auth.uid()
        and physio_patients.patient_id = sessions.patient_id
    )
  );

-- pain logs policies
create policy "pain_logs: patient full access"
  on pain_logs for all
  using (auth.uid() = patient_id);

create policy "pain_logs: physio read linked patients"
  on pain_logs for select
  using (
    exists (
      select 1 from physio_patients
      where physio_patients.physio_id = auth.uid()
        and physio_patients.patient_id = pain_logs.patient_id
    )
  );

-- reports policies
create policy "reports: patient read own"
  on reports for select
  using (auth.uid() = patient_id);

create policy "reports: physio full access"
  on reports for all
  using (auth.uid() = physio_id);

-- rom overrides policies
create policy "rom: patient read own"
  on patient_rom_overrides for select
  using (auth.uid() = patient_id);

create policy "rom: physio full access"
  on patient_rom_overrides for all
  using (auth.uid() = physio_id);

-- physio patients policies
create policy "physio_patients: physio full access"
  on physio_patients for all
  using (auth.uid() = physio_id);

create policy "physio_patients: patient read own"
  on physio_patients for select
  using (auth.uid() = patient_id);

-- exercise videos policies
create policy "exercise_videos: authenticated read"
  on exercise_videos for select
  using (auth.uid() is not null);

create policy "exercise_videos: physio manage own"
  on exercise_videos for all
  using (auth.uid() = physio_id);

-- messages policies
create policy "messages: participants read"
  on messages for select
  using (auth.uid() = patient_id or auth.uid() = physio_id);

create policy "messages: participants insert"
  on messages for insert
  with check (auth.uid() = patient_id or auth.uid() = physio_id);

create policy "messages: participants update"
  on messages for update
  using (auth.uid() = patient_id or auth.uid() = physio_id);

-- scheduled sessions policies
create policy "schedule: participants read"
  on scheduled_sessions for select
  using (auth.uid() = physio_id or auth.uid() = patient_id);

create policy "schedule: physio create"
  on scheduled_sessions for insert
  with check (auth.uid() = physio_id);

create policy "schedule: participants update"
  on scheduled_sessions for update
  using (auth.uid() = physio_id or auth.uid() = patient_id);

-- triggers
create or replace function generate_patient_code() returns trigger as $$
begin
  if new.role = 'patient' and (new.patient_code is null or new.patient_code = '') then
    new.patient_code := upper(encode(gen_random_bytes(4), 'hex'));
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_patient_code
  before insert or update of role on profiles
  for each row execute function generate_patient_code();

create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, name, role, lang, region)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'patient'),
    coalesce(new.raw_user_meta_data->>'lang', 'en'),
    coalesce(new.raw_user_meta_data->>'region', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- backfill codes
update profiles
  set patient_code = upper(encode(gen_random_bytes(4), 'hex'))
  where role = 'patient' and (patient_code is null or patient_code = '');

-- storage bucket
insert into storage.buckets (id, name, public)
values ('exercise-videos', 'exercise-videos', true)
on conflict (id) do nothing;

-- storage policies
do $$ begin
  create policy "exercise_videos_physio_upload"
    on storage.objects for insert
    to authenticated
    with check (
      bucket_id = 'exercise-videos'
      and exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'physio'
      )
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "exercise_videos_auth_read"
    on storage.objects for select
    to authenticated
    using (bucket_id = 'exercise-videos');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "exercise_videos_public_read"
    on storage.objects for select
    to anon
    using (bucket_id = 'exercise-videos');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "exercise_videos_physio_delete"
    on storage.objects for delete
    to authenticated
    using (
      bucket_id = 'exercise-videos'
      and exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'physio'
      )
    );
exception when duplicate_object then null; end $$;

-- realtime subscriptions
do $$ begin alter publication supabase_realtime add table sessions;        exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table pain_logs;       exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table plans;           exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table messages;        exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table physio_patients; exception when others then null; end $$;
