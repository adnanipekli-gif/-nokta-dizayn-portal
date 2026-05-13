import { z } from 'zod'

const koordinat = z.tuple([z.number(), z.number()])

// S1: AI Vision çıktısı için temel şema
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

// S2: Stüdyo düzenlemesinde kullanılan genişletilmiş şema
// Eski kayıtlar boş S2 alanlarıyla uyumlu kalır (.optional())
export const StudioSchema = RoloveSchema.extend({
  proje_meta: z.object({
    magaza_tipi: z.enum(['market', 'butik', 'yemek', 'firin', 'manav', 'diger']).optional(),
    tavan_yuksekligi_mm: z.number().nullable().optional(),
    zemin_tipi: z.enum(['seramik', 'epoksi', 'gridos', 'laminat', 'diger']).nullable().optional(),
    cephe_yonleri: z.object({
      kuzey: z.boolean(),
      guney: z.boolean(),
      dogu: z.boolean(),
      bati: z.boolean(),
    }).optional(),
    hedef_alan_m2: z.number().nullable().optional(),
    ozel_kisitlar: z.array(z.string()).optional(),
  }).optional(),

  tesisat: z.object({
    elektrik: z.object({
      mevcut: z.boolean(),
      guc_kva: z.number().nullable().optional(),
      faz: z.enum(['monofaze', 'trifaze']).nullable().optional(),
      pano_yeri: z.string().nullable().optional(),
    }).optional(),
    su: z.object({
      mevcut: z.boolean(),
      giris_yeri: z.string().nullable().optional(),
      basinc_bar: z.number().nullable().optional(),
    }).optional(),
    atik_su: z.object({
      mevcut: z.boolean(),
      konum: z.string().nullable().optional(),
    }).optional(),
    hvac: z.object({
      mevcut: z.boolean(),
      tip: z.enum(['split', 'vrf', 'merkezi', 'yok']).nullable().optional(),
    }).optional(),
    dogalgaz: z.object({
      mevcut: z.boolean(),
      hat_yeri: z.string().nullable().optional(),
    }).optional(),
  }).optional(),

  mevcut_ekipman: z.array(z.object({
    id: z.string(),
    ad: z.string(),
    kalacak_mi: z.boolean(),
    konum_notu: z.string(),
  })).optional(),

  notlar_liste: z.array(z.object({
    id: z.string(),
    yazan: z.string(),
    tarih: z.string(),
    metin: z.string(),
  })).optional(),

  referans_fotograflar: z.array(z.object({
    url: z.string(),
    etiket: z.string(),
  })).optional(),
})
