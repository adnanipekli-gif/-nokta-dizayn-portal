import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PDFDocument } from 'pdf-lib'
import sharp from 'sharp'
import { ROLOVE_VISION_PROMPT } from '@/lib/ai/prompts'
import { RoloveSchema } from '@/lib/ai/rolove-schema'
import { createAdminClient } from '@/lib/supabase/admin'

// claude-opus-4-7 fiyatı ($/MTok)
const PRICE_INPUT  = 15
const PRICE_OUTPUT = 75

export const maxDuration = 60

export async function POST(request) {
  const { project_id, version_id } = await request.json()

  if (!project_id || !version_id) {
    return NextResponse.json({ error: 'project_id ve version_id gerekli' }, { status: 400 })
  }

  const admin = createAdminClient()

  // ai_jobs kaydı oluştur
  const { data: job, error: jobErr } = await admin
    .from('ai_jobs')
    .insert({
      project_id,
      version_id,
      type:   'vision_analyze',
      status: 'queued',
      worker: 'anthropic',
    })
    .select()
    .single()

  if (jobErr) {
    return NextResponse.json({ error: jobErr.message }, { status: 500 })
  }

  // running yap
  await admin.from('ai_jobs').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', job.id)

  try {
    // version kaydını çek
    const { data: version, error: vErr } = await admin
      .from('project_versions')
      .select('file_url')
      .eq('id', version_id)
      .single()

    if (vErr || !version?.file_url) throw new Error('Versiyon bulunamadı')

    // Dosyayı Supabase Storage'dan indir
    const { data: fileData, error: dlErr } = await admin.storage
      .from('rolove-input')
      .download(version.file_url)

    if (dlErr || !fileData) throw new Error('Dosya indirilemedi: ' + dlErr?.message)

    const fileBuffer = Buffer.from(await fileData.arrayBuffer())
    const ext = version.file_url.split('.').pop()?.toLowerCase()

    let roloveJson
    let inputTokens  = 0
    let outputTokens = 0

    if (ext === 'dxf') {
      // DXF → doğrudan JSON (Vision gerekmez)
      roloveJson = parseDxf(fileBuffer.toString('utf-8'))
    } else {
      // Görüntü veya PDF → Claude Vision
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

      let contentBlock
      if (ext === 'pdf') {
        // İlk sayfayı ayır
        const srcDoc  = await PDFDocument.load(fileBuffer)
        const oneDoc  = await PDFDocument.create()
        const [page]  = await oneDoc.copyPages(srcDoc, [0])
        oneDoc.addPage(page)
        const pdfBytes = await oneDoc.save()
        contentBlock = {
          type: 'document',
          source: {
            type:       'base64',
            media_type: 'application/pdf',
            data:       Buffer.from(pdfBytes).toString('base64'),
          },
        }
      } else {
        // jpg / png → max 2000px'e küçült
        const resized = await sharp(fileBuffer)
          .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 85 })
          .toBuffer()

        const mime = 'image/jpeg'
        contentBlock = {
          type: 'image',
          source: {
            type:       'base64',
            media_type: mime,
            data:       resized.toString('base64'),
          },
        }
      }

      const msg = await anthropic.messages.create(
        {
          model:      'claude-opus-4-7',
          max_tokens: 4096,
          system:     ROLOVE_VISION_PROMPT,
          messages: [
            {
              role: 'user',
              content: [
                contentBlock,
                { type: 'text', text: 'Bu rölöveyi analiz et, istenen JSON formatında çıktı ver.' },
              ],
            },
          ],
        },
        ext === 'pdf' ? { headers: { 'anthropic-beta': 'pdfs-2024-09-25' } } : undefined
      )

      inputTokens  = msg.usage?.input_tokens  ?? 0
      outputTokens = msg.usage?.output_tokens ?? 0

      const raw = msg.content[0]?.text ?? ''
      const jsonStr = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/,'').trim()
      roloveJson = JSON.parse(jsonStr)
    }

    // Zod validasyonu
    const parsed = RoloveSchema.parse(roloveJson)

    // project_versions: stage='json' yeni kayıt
    const { data: maxVer } = await admin
      .from('project_versions')
      .select('version_no')
      .eq('project_id', project_id)
      .order('version_no', { ascending: false })
      .limit(1)
      .single()

    const nextNo = (maxVer?.version_no ?? 0) + 1

    await admin.from('project_versions').insert({
      project_id,
      stage:            'json',
      version_no:       nextNo,
      parent_version_id: version_id,
      ai_metadata:      parsed,
    })

    // cost hesapla
    const costUsd = (inputTokens * PRICE_INPUT + outputTokens * PRICE_OUTPUT) / 1_000_000

    await admin.from('ai_jobs').update({
      status:      'done',
      finished_at: new Date().toISOString(),
      cost_usd:    costUsd,
      log: `input=${inputTokens} output=${outputTokens} tokens | duvar=${parsed.duvarlar.length} | oda=${parsed.odalar.length} | güven=${parsed.guven_skoru}`,
    }).eq('id', job.id)

    return NextResponse.json({ ok: true, job_id: job.id, guven_skoru: parsed.guven_skoru })
  } catch (err) {
    await admin.from('ai_jobs').update({
      status:      'failed',
      finished_at: new Date().toISOString(),
      error:       err.message,
    }).eq('id', job.id)

    return NextResponse.json({ error: err.message, job_id: job.id }, { status: 500 })
  }
}

// ── DXF → ROLOVE JSON dönüştürücü ─────────────────────────────
function parseDxf(dxfStr) {
  // Dinamik import: DxfParser CommonJS modülü
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DxfParser = require('dxf-parser')
  const parser    = new DxfParser()
  let dxf
  try {
    dxf = parser.parseSync(dxfStr)
  } catch {
    throw new Error('DXF parse hatası')
  }

  const duvarlar = []
  const olcuEtiketleri = []
  let wallId = 1
  let labelId = 1

  for (const e of (dxf?.entities ?? [])) {
    if (e.type === 'LINE') {
      const [a, b] = e.vertices ?? []
      if (a && b) {
        duvarlar.push({
          id: wallId++,
          baslangic: [Math.round(a.x), Math.round(a.y)],
          bitis:     [Math.round(b.x), Math.round(b.y)],
          kalinlik_mm: 200,
          tip: 'ic',
        })
      }
    } else if (e.type === 'LWPOLYLINE' || e.type === 'POLYLINE') {
      const verts = e.vertices ?? []
      for (let i = 0; i < verts.length - 1; i++) {
        duvarlar.push({
          id: wallId++,
          baslangic: [Math.round(verts[i].x), Math.round(verts[i].y)],
          bitis:     [Math.round(verts[i + 1].x), Math.round(verts[i + 1].y)],
          kalinlik_mm: 200,
          tip: 'ic',
        })
      }
    } else if (e.type === 'TEXT' || e.type === 'MTEXT') {
      const txt = e.text || e.string || ''
      const val = parseFloat(txt)
      if (!isNaN(val) && val > 0) {
        const pos = e.position ?? e.insertionPoint ?? { x: 0, y: 0 }
        olcuEtiketleri.push({
          deger_mm: Math.round(val),
          konum:    [Math.round(pos.x), Math.round(pos.y)],
          yon:      'yatay',
        })
        labelId++
      }
    }
  }

  return {
    rolove_tipi:       'bilgisayar_cizimi',
    olcek:             'bilinmiyor',
    birim:             'mm',
    duvarlar,
    kapilar:           [],
    pencereler:        [],
    odalar:            [],
    kolonlar:          [],
    olcu_etiketleri:   olcuEtiketleri,
    guven_skoru:       duvarlar.length > 0 ? 0.75 : 0.2,
    okunamayan_alanlar: duvarlar.length === 0
      ? ['DXF boş veya desteklenmeyen entity tipleri içeriyor']
      : [],
    notlar: `DXF parser: ${duvarlar.length} duvar, ${olcuEtiketleri.length} ölçü etiketi`,
  }
}
