-- ============================================================
-- Migration 016 — Nokta Dizayn Portal v6 AI CAD Pipeline
-- Supabase SQL Editor'de elle çalıştır.
-- ============================================================

-- Profiller (auth.users genişletmesi)
create table if not exists profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  email      text,
  full_name  text,
  created_at timestamptz default now()
);

-- Yeni kullanıcı kaydında otomatik profil oluştur
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Projeler
create table if not exists projects (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  customer_name text not null,
  customer_id   uuid null,
  status        text not null default 'taslak',
  created_by    uuid references profiles(id) on delete set null,
  created_at    timestamptz default now()
);

-- Proje Versiyonları
create table if not exists project_versions (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references projects(id) on delete cascade,
  stage            text not null check (stage in (
                     'input', 'json', '2d_dxf',
                     '3d_blender', '3d_sketchup',
                     'render_concept', 'render_final'
                   )),
  version_no       int not null,
  file_url         text,
  parent_version_id uuid null references project_versions(id),
  ai_metadata      jsonb,
  created_by       uuid references profiles(id) on delete set null,
  created_at       timestamptz default now()
);

-- AI İşleri
create table if not exists ai_jobs (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  version_id  uuid null references project_versions(id) on delete set null,
  type        text not null,
  status      text not null default 'queued'
              check (status in ('queued', 'running', 'done', 'failed')),
  worker      text not null
              check (worker in ('local', 'modal', 'replicate', 'anthropic')),
  started_at  timestamptz,
  finished_at timestamptz,
  cost_usd    numeric,
  log         text,
  error       text
);

-- ── RLS ────────────────────────────────────────────────────
alter table profiles         enable row level security;
alter table projects         enable row level security;
alter table project_versions enable row level security;
alter table ai_jobs          enable row level security;

-- Profiller: kullanıcı kendi profilini görür ve düzenler
drop policy if exists "profiles_self" on profiles;
create policy "profiles_self" on profiles
  for all using (auth.uid() = id);

-- Projeler: kullanıcı sadece kendi projelerini görür
drop policy if exists "projects_own" on projects;
create policy "projects_own" on projects
  for all using (auth.uid() = created_by);

-- Versiyonlar: proje sahibi versiyonları görür
drop policy if exists "versions_own" on project_versions;
create policy "versions_own" on project_versions
  for all using (
    exists (
      select 1 from projects p
      where p.id = project_versions.project_id
        and p.created_by = auth.uid()
    )
  );

-- AI İşleri: proje sahibi görebilir
drop policy if exists "ai_jobs_own" on ai_jobs;
create policy "ai_jobs_own" on ai_jobs
  for all using (
    exists (
      select 1 from projects p
      where p.id = ai_jobs.project_id
        and p.created_by = auth.uid()
    )
  );

-- ── Storage Bucket'ları ────────────────────────────────────
insert into storage.buckets (id, name, public) values
  ('rolove-input',    'rolove-input',    false),
  ('dxf-output',      'dxf-output',      false),
  ('blender-output',  'blender-output',  false),
  ('sketchup-output', 'sketchup-output', false),
  ('render-output',   'render-output',   false)
on conflict (id) do nothing;

-- Storage RLS: kullanıcı kendi klasörünü (uid/) görür
drop policy if exists "storage_rolove_own"    on storage.objects;
drop policy if exists "storage_dxf_own"       on storage.objects;
drop policy if exists "storage_blender_own"   on storage.objects;
drop policy if exists "storage_sketchup_own"  on storage.objects;
drop policy if exists "storage_render_own"    on storage.objects;

create policy "storage_rolove_own" on storage.objects
  for all using (
    bucket_id = 'rolove-input'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "storage_dxf_own" on storage.objects
  for all using (
    bucket_id = 'dxf-output'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "storage_blender_own" on storage.objects
  for all using (
    bucket_id = 'blender-output'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "storage_sketchup_own" on storage.objects
  for all using (
    bucket_id = 'sketchup-output'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "storage_render_own" on storage.objects
  for all using (
    bucket_id = 'render-output'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
