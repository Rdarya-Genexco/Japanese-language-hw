/**
 * Parse an uploaded file for Gemini.
 *
 * PDF       → raw ArrayBuffer (Gemini reads layout, tables, images natively)
 * DOCX/DOC  → HTML via mammoth (preserves tables, headings, bold/italic, lists)
 * PNG/JPG   → raw ArrayBuffer (Gemini reads image natively)
 * PPTX      → converted to PDF via jszip+jspdf so Gemini sees slide images
 * PPT       → raw ArrayBuffer (legacy OLE format — not ZIP, cannot convert in browser)
 */

export async function extractDocxHtml(file) {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.convertToHtml({ arrayBuffer })
  if (!result.value || result.value.trim().length === 0) {
    throw new Error('Could not extract content from DOCX file.')
  }
  return result.value
}

/**
 * Convert a PPTX ArrayBuffer to a PDF ArrayBuffer.
 * Extracts images and text from each slide and places them on one PDF page per slide.
 * This lets Gemini see embedded slide images rather than just XML text.
 */
async function pptxToPdf(arrayBuffer) {
  const JSZipMod = await import('jszip')
  const JSZip = JSZipMod.default || JSZipMod
  const { jsPDF } = await import('jspdf')

  const zip = await JSZip.loadAsync(arrayBuffer)

  // Slide numbers in file order (slide1, slide2, …)
  const slideNumbers = Object.keys(zip.files)
    .filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .map(p => parseInt(p.match(/slide(\d+)\.xml/)[1]))
    .sort((a, b) => a - b)

  if (slideNumbers.length === 0) {
    // Fallback: return original bytes as a generic octet-stream so the caller can handle it
    throw new Error('No slides found in PPTX')
  }

  // Standard PPTX canvas: 10" × 7.5" landscape
  const W = 254, H = 190.5  // mm
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [W, H] })
  let firstPage = true

  for (const n of slideNumbers) {
    const slideXml = await zip.files[`ppt/slides/slide${n}.xml`].async('string')
    const relsPath = `ppt/slides/_rels/slide${n}.xml.rels`

    // Map rId → media path
    const ridToMedia = {}
    if (zip.files[relsPath]) {
      const relsXml = await zip.files[relsPath].async('string')
      for (const m of relsXml.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)) {
        ridToMedia[m[1]] = m[2]
      }
    }

    // Collect image rIds from blipFill elements
    const imageRids = [...new Set([...slideXml.matchAll(/r:embed="(rId\d+)"/g)].map(m => m[1]))]

    // Collect all text runs
    const texts = [...slideXml.matchAll(/<a:t[^>]*>([^<]+)<\/a:t>/g)]
      .map(m => m[1].trim()).filter(Boolean)

    if (!firstPage) doc.addPage()
    firstPage = false

    // White background
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, W, H, 'F')

    // ── Resolve and place images ───────────────────────────────────────────────
    const validImages = []
    for (const rid of imageRids) {
      const rel = ridToMedia[rid]
      if (!rel) continue
      // Resolve relative path: "../media/imageN.xxx" → "ppt/media/imageN.xxx"
      const mediaPath = rel.startsWith('../') ? 'ppt/' + rel.slice(3) : rel
      const mediaFile = zip.files[mediaPath]
      if (!mediaFile) continue
      const ext = mediaPath.split('.').pop().toLowerCase()
      if (!['png', 'jpg', 'jpeg'].includes(ext)) continue
      validImages.push({ mediaFile, ext })
    }

    const hasText = texts.length > 0
    const imgAreaH = hasText ? H * 0.62 : H - 10

    if (validImages.length > 0) {
      const cols = Math.min(validImages.length, 3)
      const cellW = (W - 10 - (cols - 1) * 4) / cols
      const cellH = Math.min(imgAreaH - 10, cellW * 0.75)

      for (let i = 0; i < validImages.length; i++) {
        const { mediaFile, ext } = validImages[i]
        const col = i % cols
        const row = Math.floor(i / cols)
        const x = 5 + col * (cellW + 4)
        const y = 5 + row * (cellH + 4)
        if (y + cellH > imgAreaH) break

        const b64 = await mediaFile.async('base64')
        const fmt = ext === 'png' ? 'PNG' : 'JPEG'
        doc.addImage(`data:image/${ext};base64,${b64}`, fmt, x, y, cellW, cellH, undefined, 'FAST')
      }
    }

    // ── Add text below images ──────────────────────────────────────────────────
    if (hasText) {
      const textY = validImages.length > 0 ? H * 0.65 : 8
      doc.setFontSize(10)
      doc.setTextColor(20, 20, 20)
      const joined = texts.join('  |  ')
      const lines = doc.splitTextToSize(joined, W - 16)
      doc.text(lines.slice(0, 14), 8, textY)
    }
  }

  return doc.output('arraybuffer')
}

/**
 * Parse a file and return { data, mimeType } for Gemini.
 *
 * Returns:
 *   { data: ArrayBuffer, mimeType: 'application/pdf'  }  — PDF or converted PPTX
 *   { data: string,      mimeType: 'text/html'        }  — DOCX (HTML)
 *   { data: ArrayBuffer, mimeType: 'image/png'        }  — PNG
 *   { data: ArrayBuffer, mimeType: 'image/jpeg'       }  — JPG
 *   { data: ArrayBuffer, mimeType: 'application/vnd.ms-powerpoint' } — PPT (legacy)
 */
export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'pdf') {
    return { data: await file.arrayBuffer(), mimeType: 'application/pdf' }
  }

  if (ext === 'docx' || ext === 'doc') {
    const html = await extractDocxHtml(file)
    return { data: html, mimeType: 'text/html' }
  }

  if (ext === 'png') {
    return { data: await file.arrayBuffer(), mimeType: 'image/png' }
  }

  if (ext === 'jpg' || ext === 'jpeg') {
    return { data: await file.arrayBuffer(), mimeType: 'image/jpeg' }
  }

  if (ext === 'pptx') {
    const arrayBuffer = await file.arrayBuffer()
    try {
      const pdfBuffer = await pptxToPdf(arrayBuffer)
      return { data: pdfBuffer, mimeType: 'application/pdf' }
    } catch {
      // Conversion failed — fall back to raw PPTX
      return {
        data: arrayBuffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      }
    }
  }

  if (ext === 'ppt') {
    // Legacy OLE binary format — cannot convert in browser, send as-is
    return {
      data: await file.arrayBuffer(),
      mimeType: 'application/vnd.ms-powerpoint',
    }
  }

  throw new Error('Unsupported file type. Please upload a PDF, DOCX, PPT, PPTX, PNG or JPG.')
}
