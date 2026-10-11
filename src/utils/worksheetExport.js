// PDF and Word export. Kept in its own module because jsPDF, html2canvas and docx are large:
// worksheetGenerator.js loads this file only when someone actually downloads.
import { getLang } from './languages'
import { sanitizeWorksheetHtml } from './worksheetGenerator'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun } from 'docx'
import { saveAs } from 'file-saver'

// ── HTML-based helpers (for Gemini-generated HTML worksheets) ─────────────────

/** Extract CSS and body content from a complete HTML document string. */
function parseHtmlDoc(html) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const css = Array.from(doc.querySelectorAll('style')).map(s => s.textContent).join('\n')
  doc.querySelectorAll('style, script, .no-print').forEach(el => el.remove())
  return { css, body: doc.body, title: doc.title || 'Worksheet' }
}

/**
 * Download a Gemini-generated HTML document as a PDF file.
 * Renders the HTML in a hidden off-screen div, captures with html2canvas, exports via jsPDF.
 */
export async function downloadAsPdfFromHtml(html, filename = 'worksheet') {
  const { css, body } = parseHtmlDoc(html)

  // Inject CSS + content into a hidden off-screen wrapper in the live document
  // Word "Narrow" preset: 1.27 cm all sides
  const A4_W_MM    = 210
  const A4_H_MM    = 297
  const MARGIN_MM  = 12.7
  const CONTENT_W_MM = A4_W_MM - 2 * MARGIN_MM   // 184.6 mm
  const CONTENT_H_MM = A4_H_MM - 2 * MARGIN_MM   // 271.6 mm
  // Render at the content width so the canvas maps to the printable area only
  const RENDER_W_PX = Math.round(794 * (CONTENT_W_MM / A4_W_MM))  // ≈ 698 px

  const styleEl = document.createElement('style')
  styleEl.textContent = css + `
    #__pdf-html-wrap__ {
      position: absolute !important;
      top: 0 !important;
      left: -9999px !important;
      width: ${RENDER_W_PX}px !important;
      background: #fff !important;
      color: #111 !important;
    }`
  document.head.appendChild(styleEl)

  const wrap = document.createElement('div')
  wrap.id = '__pdf-html-wrap__'
  wrap.innerHTML = sanitizeWorksheetHtml(body.innerHTML, { wholeDocument: false })
  document.body.appendChild(wrap)

  // Wait for fonts and layout — CJK/Russian Noto fonts can take 2-3 s on slow connections
  await document.fonts.ready
  await new Promise(r => setTimeout(r, 1800))

  // html2canvas scale:3 → canvas px = DOM px × 3 (sharper text/lines in PDF)
  const CANVAS_SCALE = 3

  // Measure block boundaries in DOM space BEFORE rendering so we can snap
  // page breaks to the start of each question block.
  const blockEls = wrap.querySelectorAll('.q-block')
  const measureEls = blockEls.length > 0
    ? Array.from(blockEls)
    : Array.from(wrap.querySelectorAll('p, li, h1, h2, h3, h4, table, hr'))

  // blockTops: canvas-px positions where each new block starts
  const blockTops = measureEls
    .map(el => Math.round(el.offsetTop * CANVAS_SCALE))
    .filter((y, i, a) => i === 0 || y !== a[i - 1])
    .sort((a, b) => a - b)

  try {
    const canvas = await html2canvas(wrap, {
      scale: CANVAS_SCALE,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: RENDER_W_PX,
    })

    // Nominal page height in canvas pixels
    const pageH_px = Math.round(canvas.width * (CONTENT_H_MM / CONTENT_W_MM))

    /**
     * Find the best page-break point near `nominalY`:
     * 1. Snap back to the nearest block-top that fits (DOM-aware, most reliable).
     * 2. Fall back to pixel-scanning ≥ 85 % white row, up to 600 px back.
     * 3. Ultimate fallback: cut at nominalY.
     */
    function findBreakRow(nominalY) {
      if (nominalY >= canvas.height) return canvas.height

      // ① DOM-aware snap: last block top that is ≤ nominalY
      const snapped = blockTops.filter(y => y > 0 && y <= nominalY).pop()
      if (snapped !== undefined && nominalY - snapped <= pageH_px * 0.5) {
        return snapped
      }

      // ② Pixel scan: upward up to 600 px for ≥ 85 % white row.
      // Use a 1-row offscreen canvas with willReadFrequently to avoid the
      // "multiple readback operations" browser warning.
      const w = canvas.width
      const scanCvs = document.createElement('canvas')
      scanCvs.width = w
      scanCvs.height = 1
      const scanCtx = scanCvs.getContext('2d', { willReadFrequently: true })
      const scanLimit = Math.max(0, nominalY - 600)
      for (let y = nominalY; y >= scanLimit; y--) {
        scanCtx.clearRect(0, 0, w, 1)
        scanCtx.drawImage(canvas, 0, y, w, 1, 0, 0, w, 1)
        const d = scanCtx.getImageData(0, 0, w, 1).data
        let whites = 0
        for (let i = 0; i < d.length; i += 4) {
          if (d[i] > 230 && d[i + 1] > 230 && d[i + 2] > 230) whites++
        }
        if (whites / w >= 0.85) return y
      }

      return nominalY  // ③ fallback
    }

    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
    let srcY = 0
    let pageNum = 0

    while (srcY < canvas.height) {
      if (pageNum > 0) doc.addPage()
      pageNum++

      const nominalEnd = srcY + pageH_px
      const breakY = nominalEnd >= canvas.height ? canvas.height : findBreakRow(nominalEnd)
      const srcH = Math.max(1, breakY - srcY)

      const pageCanvas = document.createElement('canvas')
      pageCanvas.width  = canvas.width
      pageCanvas.height = srcH
      const ctx = pageCanvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)

      const imgData = pageCanvas.toDataURL('image/jpeg', 0.93)
      const imgH_mm = (srcH / canvas.width) * CONTENT_W_MM
      doc.addImage(imgData, 'JPEG', MARGIN_MM, MARGIN_MM, CONTENT_W_MM, imgH_mm)

      srcY = breakY
    }

    const safeName = filename.replace(/[/\\:*?"<>|]/g, '_').slice(0, 50)
    doc.save(`${safeName}.pdf`)

  } finally {
    if (wrap.parentNode)    document.body.removeChild(wrap)
    if (styleEl.parentNode) document.head.removeChild(styleEl)
  }
}

/**
 * Download a Gemini-generated HTML document as a DOCX file.
 * Parses the HTML DOM and maps headings / paragraphs / tables into docx constructs.
 */
export async function downloadAsDocxFromHtml(html, filename = 'worksheet') {
  const { body } = parseHtmlDoc(html)
  const children = []

  // Standard paragraph spacing: 0 pt before, 8 pt after, 1.5 line spacing
  // (matches Word "Indents and Spacing" panel: Before 0 pt / After 8 pt / Line spacing 1.5 lines)
  const SP     = { before: 0, after: 160, line: 360, lineRule: 'auto' }  // body paragraphs
  const SP_H1  = { before: 0, after: 160, line: 360, lineRule: 'auto' }
  const SP_H2  = { before: 160, after: 160, line: 360, lineRule: 'auto' }  // small gap before section headers
  const SP_H3  = { before: 80,  after: 160, line: 360, lineRule: 'auto' }
  const MAX_W_PT  = 396    // max image width in points (72 pt/in × 5.5 in ≈ 14 cm)
  const PT_TO_EMU = 12700  // 1 pt = 12700 EMU (unit docx ImageRun expects)

  // Turn child nodes into TextRun array, preserving bold/italic and .en-sub gray text
  function nodeToRuns(el) {
    const runs = []
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const t = node.textContent
        if (t) runs.push(new TextRun({ text: t, size: 22 }))
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase()
        const t   = node.textContent
        if (!t.trim()) continue
        const isEnSub = node.classList?.contains('en-sub') || node.classList?.contains('en-ref')
        if (isEnSub) {
          runs.push(new TextRun({ text: '\n' + t, size: 17, italics: true, color: '9CA3AF' }))
        } else if (tag === 'strong' || tag === 'b') {
          runs.push(new TextRun({ text: t, size: 22, bold: true }))
        } else if (tag === 'em' || tag === 'i') {
          runs.push(new TextRun({ text: t, size: 22, italics: true }))
        } else if (tag === 'br') {
          runs.push(new TextRun({ text: '', break: 1 }))
        } else {
          runs.push(...nodeToRuns(node))
        }
      }
    }
    return runs
  }

  // Walk the DOM and emit DOCX blocks
  function processNode(el) {
    const tag = el.tagName?.toLowerCase()
    if (!tag) return
    const text = el.textContent.trim()

    switch (tag) {
      case 'h1':
        children.push(new Paragraph({
          children: [new TextRun({ text, bold: true, size: 32, color: '1D4ED8' })],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: SP_H1,
        }))
        break
      case 'h2':
        children.push(new Paragraph({
          children: [new TextRun({ text, bold: true, size: 26, color: '1D4ED8' })],
          heading: HeadingLevel.HEADING_2,
          spacing: SP_H2,
        }))
        break
      case 'h3':
      case 'h4':
        children.push(new Paragraph({
          children: [new TextRun({ text, bold: true, size: 24 })],
          spacing: SP_H3,
        }))
        break
      case 'p':
        if (text) {
          children.push(new Paragraph({
            children: nodeToRuns(el),
            spacing: SP,
          }))
        }
        break
      case 'table': {
        const rows = Array.from(el.querySelectorAll('tr')).map(tr => {
          const cells = Array.from(tr.querySelectorAll('td, th')).map(td =>
            new TableCell({
              children: [new Paragraph({ children: nodeToRuns(td), spacing: SP })],
            })
          )
          return new TableRow({ children: cells })
        })
        if (rows.length) {
          children.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }))
          children.push(new Paragraph({ spacing: SP }))
        }
        break
      }
      case 'ul':
      case 'ol':
        for (const li of el.querySelectorAll(':scope > li')) {
          children.push(new Paragraph({
            children: [new TextRun({ text: '• ' + li.textContent.trim(), size: 22 })],
            spacing: SP,
          }))
        }
        break
      case 'hr':
        children.push(new Paragraph({
          children: [new TextRun({ text: '' })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } },
          spacing: SP,
        }))
        break
      case 'br':
        children.push(new Paragraph({ children: [new TextRun({ text: '' })], spacing: SP }))
        break
      // Container elements — recurse
      case 'div': case 'section': case 'article': case 'main':
      case 'header': case 'body': case 'span': {
        // For leaf-ish divs that contain only inline content (no block children), treat as paragraph
        const hasBlockChildren = Array.from(el.children).some(c =>
          ['div','p','h1','h2','h3','h4','h5','table','ul','ol','hr','section','img'].includes(c.tagName?.toLowerCase())
        )
        if (!hasBlockChildren && text) {
          children.push(new Paragraph({ children: nodeToRuns(el), spacing: SP }))
        } else {
          for (const child of el.children) processNode(child)
        }
        break
      }
      case 'img': {
        const src = el.getAttribute('src') || ''
        // Only embed data URIs (base64-encoded images); skip external URLs
        const dataUriMatch = src.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/)
        if (dataUriMatch) {
          const mimeType = dataUriMatch[1]   // e.g. "image/jpeg"
          const base64   = dataUriMatch[2]
          // Decode to Uint8Array for the docx library (cached length avoids repeated .length reads)
          const binaryStr = atob(base64)
          const len   = binaryStr.length
          const bytes = new Uint8Array(len)
          for (let i = 0; i < len; i++) bytes[i] = binaryStr.charCodeAt(i)
          // Use explicit HTML width/height attributes (px) if present; fall back to full-width 4:3.
          // naturalWidth/naturalHeight are always 0 in a DOMParser tree (no image loading).
          const srcW = el.width  || 0
          const srcH = el.height || 0
          let wPt = srcW > 0 ? Math.round(srcW * 72 / 96) : MAX_W_PT   // px → pt at 96 dpi
          let hPt = srcH > 0 ? Math.round(srcH * 72 / 96) : Math.round(MAX_W_PT * 0.75)
          // Scale down uniformly to fit within MAX_W_PT; no-op when wPt ≤ MAX_W_PT
          const scale = Math.min(1, MAX_W_PT / wPt)
          wPt = Math.round(wPt * scale)
          hPt = Math.round(hPt * scale)
          children.push(new Paragraph({
            children: [new ImageRun({
              data       : bytes.buffer,
              type       : mimeType.replace('image/', ''),
              transformation: {
                width : wPt * PT_TO_EMU,
                height: hPt * PT_TO_EMU,
              },
            })],
            alignment: AlignmentType.CENTER,
            spacing  : SP,
          }))
        }
        break
      }
      default:
        if (text) {
          children.push(new Paragraph({ children: [new TextRun({ text, size: 22 })], spacing: SP }))
        }
    }
  }

  processNode(body)

  if (!children.length) {
    children.push(new Paragraph({ children: [new TextRun({ text: 'No content', size: 22 })] }))
  }

  // 1.27 cm = 720 twips (Word "Narrow" preset: all sides equal)
  const MARGIN_TWIPS = 720
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top:    MARGIN_TWIPS,
            right:  MARGIN_TWIPS,
            bottom: MARGIN_TWIPS,
            left:   MARGIN_TWIPS,
          },
        },
      },
      children,
    }],
  })
  const blob = await Packer.toBlob(doc)
  const safeName = filename.replace(/[/\\:*?"<>|]/g, '_').slice(0, 50)
  saveAs(blob, `${safeName}.docx`)
}

// ── PDF download (html2canvas → jsPDF) ───────────────────────────────────────

export async function downloadAsPdf(worksheetData) {
  const lang = getLang(worksheetData.language)

  // Inject target font into the live document if not already present
  const fontHref = `https://fonts.googleapis.com/css2?family=${lang.fontQuery}&display=swap`
  if (!document.querySelector(`link[href="${fontHref}"]`)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = fontHref
    document.head.appendChild(link)
    await document.fonts.ready
    await new Promise(r => setTimeout(r, 400))
  }

  const html = generatePrintableHTML(worksheetData)
  const styleContent = (html.match(/<style>([\s\S]*?)<\/style>/) || ['', ''])[1]
  const bodyContent  = (html.match(/<body>([\s\S]*)<\/body>/)   || ['', ''])[1]
  const cleanBody = bodyContent.replace(/<div class="no-print"[\s\S]*?<\/div>\s*/g, '')

  const styleEl = document.createElement('style')
  styleEl.textContent = styleContent + `
    #__pdf-wrap__ {
      position: absolute !important;
      top: 0 !important;
      left: -9999px !important;
      width: 794px !important;
      background: #fff !important;
      color: #1a1a1a !important;
    }`
  document.head.appendChild(styleEl)

  const wrap = document.createElement('div')
  wrap.id = '__pdf-wrap__'
  wrap.innerHTML = cleanBody
  document.body.appendChild(wrap)

  await document.fonts.ready
  await new Promise(r => setTimeout(r, 600))

  try {
    const canvas = await html2canvas(wrap, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
    })

    const A4_W_MM = 210
    const A4_H_MM = 297
    const pageH_px = Math.round(canvas.width * (A4_H_MM / A4_W_MM))
    const totalPages = Math.ceil(canvas.height / pageH_px)

    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) doc.addPage()

      const srcY = p * pageH_px
      const srcH = Math.min(pageH_px, canvas.height - srcY)

      const pageCanvas = document.createElement('canvas')
      pageCanvas.width  = canvas.width
      pageCanvas.height = srcH
      const ctx = pageCanvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)

      const imgData = pageCanvas.toDataURL('image/jpeg', 0.93)
      const imgH_mm = (srcH / canvas.width) * A4_W_MM
      doc.addImage(imgData, 'JPEG', 0, 0, A4_W_MM, imgH_mm)
    }

    const safeName = (worksheetData.title || 'Worksheet')
      .replace(/[/\\:*?"<>|]/g, '_')
      .slice(0, 40)
    doc.save(`${safeName}.pdf`)

  } finally {
    if (wrap.parentNode)    document.body.removeChild(wrap)
    if (styleEl.parentNode) document.head.removeChild(styleEl)
  }
}

// ── DOCX download ─────────────────────────────────────────────────────────────

export async function downloadAsDocx(worksheetData) {
  const { title, titleEn, subject, subjectEn, grade, instructions, instructionsEn, sections = [] } = worksheetData
  const lang = getLang(worksheetData.language)
  const ui = lang.ui

  // Text run helpers
  const main = (text, opts = {}) => new TextRun({ text: String(text || ''), size: 22, ...opts })
  const sub  = (text) => new TextRun({ text: String(text || ''), size: 17, color: '9CA3AF', italics: true })
  const br   = () => new TextRun({ text: '', break: 1 })

  const children = []

  // Title
  const titleRuns = [main(title || 'Worksheet', { bold: true, size: 28 })]
  if (titleEn) titleRuns.push(br(), sub(titleEn))
  children.push(new Paragraph({ children: titleRuns, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 160 } }))

  // Subject / grade
  const metaParts = []
  if (subject) metaParts.push(main(subject, { color: '374151' }))
  if (subjectEn) { if (metaParts.length) metaParts.push(main(' / ', { color: '9CA3AF' })); metaParts.push(sub(subjectEn)) }
  if (grade) { if (metaParts.length) metaParts.push(main('   ')); metaParts.push(main(grade, { color: '374151' })) }
  if (metaParts.length) {
    children.push(new Paragraph({ children: metaParts, alignment: AlignmentType.CENTER, spacing: { after: 160 } }))
  }

  // Name / class / number fields
  children.push(new Paragraph({
    children: [main(`${ui.name}：________________    ${ui.cls}：____________    ${ui.num}：________`)],
    spacing: { after: 240 },
  }))

  // Overall instructions
  if (instructions) {
    const runs = [main('📋 ' + instructions, { italics: true, color: '1E40AF' })]
    if (instructionsEn) runs.push(br(), sub(instructionsEn))
    children.push(new Paragraph({ children: runs, spacing: { after: 240 } }))
  }

  // Sections
  for (let si = 0; si < sections.length; si++) {
    const section = sections[si]

    // Section heading
    const hRuns = [main(`${si + 1}.  ${section.sectionTitle || section.type}`, { bold: true })]
    if (section.sectionTitleEn) hRuns.push(br(), sub(section.sectionTitleEn))
    children.push(new Paragraph({ children: hRuns, heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 100 } }))

    // Section instructions
    if (section.instructions) {
      const runs = [main(section.instructions, { italics: true, color: '555555' })]
      if (section.instructionsEn) runs.push(br(), sub(section.instructionsEn))
      children.push(new Paragraph({ children: runs, spacing: { after: 100 } }))
    }

    const qs = section.questions || []

    // Matching — term column + blank answer column + word bank below
    if (section.type === 'matching' && qs.length) {
      const LABELS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const n = qs.length
      const shift = Math.floor(n / 2) + 1
      const wordBank = qs.map((_, j) => ({
        label: LABELS[j % 26],
        q: qs[(j + shift) % n],
      }))

      const headerRow = new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ children: [main(ui.term, { bold: true, color: 'FFFFFF' })] })], shading: { fill: '1D4ED8' }, width: { size: 75, type: WidthType.PERCENTAGE } }),
        new TableCell({ children: [new Paragraph({ children: [main(ui.answer || 'Answer', { bold: true, color: 'FFFFFF' })] })], shading: { fill: '1D4ED8' }, width: { size: 25, type: WidthType.PERCENTAGE } }),
      ]})
      const dataRows = qs.map((q, i) => new TableRow({ children: [
        new TableCell({ children: [new Paragraph({ children: [
          main(`${i + 1}. ${q.left || ''}`),
          ...(q.leftEn ? [br(), sub(q.leftEn)] : []),
        ]})] }),
        new TableCell({ children: [new Paragraph({ children: [main('___________')] })] }),
      ]}))
      children.push(new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }))

      // Word bank
      children.push(new Paragraph({ children: [main('')], spacing: { after: 100 } }))
      children.push(new Paragraph({ children: [main(`📝 ${ui.wordBank || 'Word Bank'}`, { bold: true, color: '1D4ED8' })], spacing: { after: 80 } }))
      for (const { label, q } of wordBank) {
        const runs = [main(`${label}.  ${q.right || ''}`)]
        if (q.rightEn) runs.push(br(), sub(`    ${q.rightEn}`))
        children.push(new Paragraph({ children: runs, spacing: { after: 60 } }))
      }
      children.push(new Paragraph({ spacing: { after: 200 } }))
      continue
    }

    // All other types
    for (const q of qs) {
      const num = q.id ?? qs.indexOf(q) + 1

      switch (section.type) {
        case 'fill_blank':
          children.push(new Paragraph({ children: [
            main(`${num}. ${q.text || ''}`),
            ...(q.textEn ? [br(), sub(q.textEn)] : []),
          ], spacing: { after: 140 } }))
          break

        case 'multiple_choice':
          children.push(new Paragraph({ children: [
            main(`${num}. ${q.text || ''}`),
            ...(q.textEn ? [br(), sub(q.textEn)] : []),
          ], spacing: { after: 80 } }))
          for (let oi = 0; oi < (q.options || []).length; oi++) {
            const optRuns = [main(`    ${q.options[oi]}`)]
            if (q.optionsEn?.[oi]) optRuns.push(br(), sub(`    ${q.optionsEn[oi]}`))
            children.push(new Paragraph({ children: optRuns, spacing: { after: 60 } }))
          }
          children.push(new Paragraph({ spacing: { after: 100 } }))
          break

        case 'true_false':
          children.push(new Paragraph({ children: [
            main(`${num}. ${q.text || ''}`),
            ...(q.textEn ? [br(), sub(q.textEn)] : []),
            br(), main(`    [ ${ui.trueLabel}        ${ui.falseLabel} ]`, { color: '555555' }),
          ], spacing: { after: 140 } }))
          break

        case 'short_answer':
        case 'essay': {
          const lineCount = q.lines || (section.type === 'essay' ? 8 : 3)
          children.push(new Paragraph({ children: [
            main(`${num}. ${q.text || ''}`),
            ...(q.textEn ? [br(), sub(q.textEn)] : []),
          ], spacing: { after: 80 } }))
          for (let l = 0; l < lineCount; l++) {
            children.push(new Paragraph({
              children: [new TextRun({ text: '', size: 22 })],
              border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC' } },
              spacing: { after: 100 },
            }))
          }
          break
        }

        case 'ordering':
          children.push(new Paragraph({ children: [
            main(`${num}. ${q.text || ''}`),
            ...(q.textEn ? [br(), sub(q.textEn)] : []),
          ], spacing: { after: 80 } }))
          for (let j = 0; j < (q.items || []).length; j++) {
            const itemRuns = [main(`    ${j + 1})  ${q.items[j]}`)]
            if (q.itemsEn?.[j]) itemRuns.push(br(), sub(`         ${q.itemsEn[j]}`))
            children.push(new Paragraph({ children: itemRuns, spacing: { after: 60 } }))
          }
          children.push(new Paragraph({ spacing: { after: 120 } }))
          break

        default:
          children.push(new Paragraph({ children: [
            main(`${num}. ${q.text || JSON.stringify(q)}`),
          ], spacing: { after: 140 } }))
      }
    }
  }

  const doc = new Document({ sections: [{ properties: {}, children }] })
  const blob = await Packer.toBlob(doc)
  const fileName = `${(title || 'Worksheet').replace(/[/\\:*?"<>|]/g, '_').slice(0, 50)}.docx`
  saveAs(blob, fileName)
}
