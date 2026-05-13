-- ============================================================
-- Migration 017 — Rölöve Analiz Stüdyosu
-- Supabase SQL Editor'de elle çalıştır.
-- ============================================================

-- project_versions tablosuna onay alanları ekle
alter table project_versions
  add column if not exists approved    boolean default false,
  add column if not exists approved_at timestamptz null,
  add column if not exists approved_by uuid null;

-- Referans fotoğraf bucket'ı
insert into storage.buckets (id, name, public) values
  ('rolove-photos', 'rolove-photos', false)
on conflict (id) do nothing;

-- Storage RLS: kullanıcı kendi klasörünü görür
drop policy if exists "storage_photos_own" on storage.objects;
create policy "storage_photos_own" on storage.objects
  for all using (
    bucket_id = 'rolove-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
