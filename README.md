# Nokta Dizayn Portal v6

ND Group Mimari Proje Yönetim Platformu — AI destekli CAD/3D/Render hattının iskeleti.

**Stack:** Next.js 16 (App Router) · Supabase · Tailwind CSS · React 18

## Geliştirme

```bash
npm install
npm run dev   # http://localhost:3000
npm run build
```

## Ortam Değişkenleri

`.env.local` dosyası oluşturun (`.env.example`'dan kopyalayın):

```env
NEXT_PUBLIC_SUPABASE_URL=https://mzaeewpfztfpywqslltx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE=...   # Supabase Dashboard > Project Settings > API > service_role
```

## Veritabanı Migration

`migrations/016_ai_cad_pipeline.sql` dosyasını **Supabase SQL Editor'de elle çalıştırın** (zaten uygulandı):

1. [Supabase Dashboard](https://supabase.com/dashboard) → Projeyi seç
2. **SQL Editor** → New Query → içeriği yapıştır → **Run**

Migration şunları oluşturur:
- `profiles` — auth.users genişletmesi + trigger
- `projects` — proje yönetimi (RLS: created_by = auth.uid())
- `project_versions` — versiyon geçmişi (input/json/2d_dxf/3d_blender/3d_sketchup/render_*)
- `ai_jobs` — AI işleri kuyruğu (queued/running/done/failed)
- Storage: `rolove-input` · `dxf-output` · `blender-output` · `sketchup-output` · `render-output`

## Rota Yapısı

```
/login                  → Magic link girişi (şifresiz)
/projects               → Proje listesi + "Yeni Proje" modalı
/projects/[id]          → 5 sekme: Input | 2D | 3D | Render | Versiyonlar
/auth/callback          → Supabase magic link callback
/auth/signout           → Oturum kapatma
```

## Sprint Planı

| Sprint | Kapsam |
|--------|--------|
| S0 ✅  | Next.js 16 + Supabase altyapısı, auth, proje CRUD, 5 sekme iskeleti |
| S1     | Input sekmesi: rölöve fotoğraf yükleme + OCR |
| S2     | JSON → 2D DXF üretimi |
| S3     | DXF → Blender 3D |
| S4     | 3D → Render (Replicate/Modal) |

## Vercel Deploy

Ortam değişkenlerini Vercel Dashboard → Environment Variables'a ekleyin:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE`

**Canlı:** https://nokta-dizayn-portal.vercel.app

## Destek
ND Group Companies — ndgroupcompnies@gmail.com
