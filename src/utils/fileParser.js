/**
 * Parse an uploaded file for Gemini.
 *
 * PDF       → raw ArrayBuffer (Gemini reads layout, tables, images natively)
 * DOCX/DOC  → HTML via mammoth (preserves tables, headings, bold/italic, lists)
 * PNG/JPG   → raw ArrayBuffer (Gemini reads image natively)
 * PPTX      → { slideText, images } so Gemini sees text + each image inline
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
 * Extract text and images from a PPTX file for sending to Gemini.
 *
 * Returns:
 *   slideText — structured plain-text document with one === SLIDE N === block per slide.
 *               Each block includes [PPTX_IMAGE_N] markers at the positions where
 *               images appear so Gemini knows where to place them.
 *   images    — [{b64, ext, mimeType}] in slide order, deduplicated across slides.
 */
/**
 * Compress a base64 image using Canvas so large PPTX images don't timeout Gemini.
 * Resizes to max 700px and re-encodes as JPEG at 65% quality.
 * Falls back to the original if Canvas is unavailable (e.g. Node.js).
 */
async function compressB64Image(b64, srcMimeType) {
  if (typeof document === 'undefined') return { b64, mimeType: srcMimeType }
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 700
      let { naturalWidth: w, naturalHeight: h } = img
      if (w > MAX || h > MAX) {
        const s = MAX / Math.max(w, h)
        w = Math.round(w * s); h = Math.round(h * s)
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.65)
      resolve({ b64: dataUrl.split(',')[1], mimeType: 'image/jpeg' })
    }
    img.onerror = () => resolve({ b64, mimeType: srcMimeType })
    img.src = `data:${srcMimeType};base64,${b64}`
  })
}

async function extractPptxContent(arrayBuffer) {
  const JSZipMod = await import('jszip')
  const JSZip = JSZipMod.default || JSZipMod
  const zip = await JSZip.loadAsync(arrayBuffer)

  const slideNumbers = Object.keys(zip.files)
    .filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .map(p => parseInt(p.match(/slide(\d+)\.xml/)[1]))
    .sort((a, b) => a - b)

  if (slideNumbers.length === 0) throw new Error('No slides found in PPTX')

  const images = []       // [{b64, ext, mimeType}]
  const seenMedia = new Set()
  const mediaToIdx = {}   // mediaPath → image index

  // Pass 1: collect unique images in slide order (compressed to keep payload small)
  for (const n of slideNumbers) {
    const slideXml = await zip.files[`ppt/slides/slide${n}.xml`].async('string')
    const relsPath = `ppt/slides/_rels/slide${n}.xml.rels`
    const ridToMedia = {}
    if (zip.files[relsPath]) {
      const rx = await zip.files[relsPath].async('string')
      for (const m of rx.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)) ridToMedia[m[1]] = m[2]
    }
    const seenRids = new Set()
    for (const m of slideXml.matchAll(/r:embed="(rId\d+)"/g)) {
      const rid = m[1]
      if (seenRids.has(rid)) continue; seenRids.add(rid)
      const rel = ridToMedia[rid]; if (!rel) continue
      const mediaPath = rel.startsWith('../') ? 'ppt/' + rel.slice(3) : rel
      if (seenMedia.has(mediaPath)) continue
      const mediaFile = zip.files[mediaPath]; if (!mediaFile) continue
      const ext = mediaPath.split('.').pop().toLowerCase()
      if (!['png', 'jpg', 'jpeg'].includes(ext)) continue
      seenMedia.add(mediaPath)
      const rawB64 = await mediaFile.async('base64')
      const srcMime = ext === 'png' ? 'image/png' : 'image/jpeg'
      const { b64, mimeType } = await compressB64Image(rawB64, srcMime)
      mediaToIdx[mediaPath] = images.length
      images.push({ b64, ext: mimeType === 'image/png' ? 'png' : 'jpg', mimeType })
    }
  }

  // Pass 2: build structured slide text with [PPTX_IMAGE_N] markers
  const slideBlocks = []
  for (const n of slideNumbers) {
    const slideXml = await zip.files[`ppt/slides/slide${n}.xml`].async('string')
    const relsPath = `ppt/slides/_rels/slide${n}.xml.rels`
    const ridToMedia = {}
    if (zip.files[relsPath]) {
      const rx = await zip.files[relsPath].async('string')
      for (const m of rx.matchAll(/Id="(rId\d+)"[^>]*Target="([^"]+)"/g)) ridToMedia[m[1]] = m[2]
    }
    const slideMediaPaths = []
    const seenRids = new Set()
    for (const m of slideXml.matchAll(/r:embed="(rId\d+)"/g)) {
      const rid = m[1]
      if (seenRids.has(rid)) continue; seenRids.add(rid)
      const rel = ridToMedia[rid]; if (!rel) continue
      const mediaPath = rel.startsWith('../') ? 'ppt/' + rel.slice(3) : rel
      if (mediaToIdx[mediaPath] !== undefined) slideMediaPaths.push(mediaPath)
    }
    const texts = [...slideXml.matchAll(/<a:t[^>]*>([^<]+)<\/a:t>/g)]
      .map(m => m[1].trim()).filter(Boolean)
    const imgMarkers = slideMediaPaths.map(mp => `[PPTX_IMAGE_${mediaToIdx[mp]}]`)
    const imgNote = imgMarkers.length > 0 ? `[IMAGES: ${imgMarkers.join(', ')}]\n` : ''
    slideBlocks.push(`=== SLIDE ${n} ===\n${imgNote}${texts.join('\n') || '(no text)'}`)
  }

  return { slideText: slideBlocks.join('\n\n'), images }
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
      const content = await extractPptxContent(arrayBuffer)
      return { data: content, mimeType: 'application/x-pptx-slides' }
    } catch {
      // Extraction failed — fall back to raw PPTX bytes
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
