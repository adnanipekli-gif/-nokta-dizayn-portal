import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PDFDocument } from 'pdf-lib'
import sharp from 'sharp'
import { REANALYZE_PROMPT, ROLOVE_VISION_PROMPT } from '@/lib/ai/prompts'
import { RoloveSchema } from '@/lib/ai/rolove-schema'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

export async function POST(request) {
  try {
    const { project_id, input_version_id, current_data } = await request.json()

    if (!project_id || !input_version_id) {
      return NextResponse.json({ error: 'project_id ve input_version_id gerekli' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Orijinal input versiyonunu bul
    const { data: version, error: vErr } = await admin
      .from('project_versions')
      .select('file_url')
      .eq('id', input_version_id)
      .single()

    if (vErr || !version?.file_url) {
      return NextResponse.json({ error: 'Input versiyonu bulunamadı' }, { status: 404 })
    }

    const { data: fileData, error: dlErr } = await admin.storage
      .from('rolove-input')
      .download(version.file_url)

    if (dlErr || !fileData) {
      return NextResponse.json({ error: 'Dosya indirilemedi: ' + dlErr?.message }, { status: 500 })
    }

    const fileBuffer = Buffer.from(await fileData.arrayBuffer())
    const ext = version.file_url.split('.').pop()?.toLowerCase()

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    let contentBlock
    let betaHeader

    if (ext === 'pdf') {
      const srcDoc  = await PDFDocument.load(fileBuffer)
      const oneDoc  = await PDFDocument.create()
      const [page]  = await oneDoc.copyPages(srcDoc, [0])
      oneDoc.addPage(page)
      const pdfBytes = await oneDoc.save()
      contentBlock = {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: Buffer.from(pdfBytes).toString('base64') },
      }
      betaHeader = { headers: { 'anthropic-beta': 'pdfs-2024-09-25' } }
    } else if (['jpg', 'jpeg', 'png'].includes(ext)) {
      const resized = await sharp(fileBuffer)
        .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer()
      contentBlock = {
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: resized.toString('base64') },
      }
    } else {
      return NextResponse.json({ error: 'DXF dosyaları için yeniden analiz desteklenmiyor' }, { status: 400 })
    }

    const contextText = current_data
      ? `Kullanıcının mevcut düzeltmeleri:\n${JSON.stringify({
          duvarlar: current_data.duvarlar,
          kapilar: current_data.kapilar,
          pencereler: current_data.pencereler,
          odalar: current_data.odalar,
          kolonlar: current_data.kolonlar,
        }, null, 2)}\n\nBu düzeltmeleri koruyarak eksik/düşük güvenli alanları tekrar analiz et.`
      : 'Rölöveyi analiz et.'

    const msg = await anthropic.messages.create(
      {
        model:      'claude-opus-4-7',
        max_tokens: 4096,
        system:     REANALYZE_PROMPT + '\n\n' + ROLOVE_VISION_PROMPT,
        messages: [{
          role: 'user',
          content: [
            contentBlock,
            { type: 'text', text: contextText },
          ],
        }],
      },
      betaHeader,
    )

    const raw     = msg.content[0]?.text ?? ''
    const jsonStr = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim()
    const parsed  = RoloveSchema.parse(JSON.parse(jsonStr))

    return NextResponse.json({
      ok:   true,
      data: parsed,
      usage: {
        input_tokens:  msg.usage?.input_tokens,
        output_tokens: msg.usage?.output_tokens,
      },
    })
  } catch (err) {
    console.error('[re-analyze]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
