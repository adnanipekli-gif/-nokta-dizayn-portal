import { z } from 'zod'

const koordinat = z.tuple([z.number(), z.number()])

export const RoloveSchema = z.object({
  rolove_tipi: z.enum(['el_cizimi', 'bilgisayar_cizimi', 'fotograf', 'karma']),
  olcek: z.enum(['1:50', '1:100', '1:200', 'bilinmiyor']),
  birim: z.literal('mm'),
  duvarlar: z.array(z.object({
    id: z.number(),
    baslangic: koordinat,
    bitis: koordinat,
    kalinlik_mm: z.number(),
    tip: z.enum(['dis', 'ic', 'bolme']),
  })),
  kapilar: z.array(z.object({
    id: z.number(),
    duvar_id: z.number(),
    konum_mm: z.number(),
    genislik_mm: z.number(),
    yon: z.enum(['sag', 'sol', 'iki_yon']),
  })),
  pencereler: z.array(z.object({
    id: z.number(),
    duvar_id: z.number(),
    konum_mm: z.number(),
    genislik_mm: z.number(),
    yukseklik_mm: z.number(),
    alt_kot_mm: z.number(),
  })),
  odalar: z.array(z.object({
    id: z.number(),
    ad: z.string(),
    alan_m2: z.number(),
    polygon: z.array(koordinat),
  })),
  kolonlar: z.array(z.object({
    id: z.number(),
    merkez: koordinat,
    genislik_mm: z.number(),
    derinlik_mm: z.number(),
  })),
  olcu_etiketleri: z.array(z.object({
    deger_mm: z.number(),
    konum: koordinat,
    yon: z.enum(['yatay', 'dikey']),
  })),
  guven_skoru: z.number().min(0).max(1),
  okunamayan_alanlar: z.array(z.string()),
  notlar: z.string(),
})
