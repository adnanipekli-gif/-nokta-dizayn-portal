import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PDFDocument } from 'pdf-lib'
import sharp from 'sharp'
import { CHAT_PROMPT } from '@/lib/ai/prompts'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 30

export async function POST(request) {
  try {
    const { project_id, version_id, question } = await request.json()
    if (!question?.trim()) return NextResponse.json({ error: 'Soru gerekli' }, { status: 400 })

    if (!version_id) {
      return NextResponse.json({ answer: 'Önce bir rölöve yükleyip analiz edin.' })
    }

    const admin = createAdminClient()
    const { data: version } = await admin.from('project_versions').select('file_url').eq('id', version_id).single()
    if (!version?.file_url) return NextResponse.json({ answer: 'Görsel bulunamadı.' })

    const { data: fileData } = await admin.storage.from('rolove-input').download(version.file_url)
    if (!fileData) return NextResponse.json({ answer: 'Görsel indirilemedi.' })

    const fileBuffer = Buffer.from(await fileData.arrayBuffer())
    const ext = version.file_url.split('.').pop()?.toLowerCase()

    if (ext === 'dxf') return NextResponse.json({ answer: 'DXF dosyaları için sohbet desteklenmiyor. Görseli veya PDF\'i analiz ettirin.' })

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    let contentBlock, betaHeader
    if (ext === 'pdf') {
      const srcDoc  = await PDFDocument.load(fileBuffer)
      const oneDoc  = await PDFDocument.create()
      const [page]  = await oneDoc.copyPages(srcDoc, [0])
      oneDoc.addPage(page)
      const pdfBytes = await oneDoc.save()
      contentBlock = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: Buffer.from(pdfBytes).toString('base64') } }
      betaHeader = { headers: { 'anthropic-beta': 'pdfs-2024-09-25' } }
    } else {
      const resized = await sharp(fileBuffer)
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer()
      contentBlock = { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: resized.toString('base64') } }
    }

    const msg = await anthropic.messages.create(
      {
        model:      'claude-opus-4-7',
        max_tokens: 512,
        system:     CHAT_PROMPT,
        messages: [{ role: 'user', content: [contentBlock, { type: 'text', text: question }] }],
      },
      betaHeader,
    )

    return NextResponse.json({ answer: msg.content[0]?.text ?? 'Cevap alınamadı.' })
  } catch (err) {
    console.error('[chat]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
