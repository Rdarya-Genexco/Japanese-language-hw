/**
 * Parse an uploaded file for Gemini.
 *
 * PDF       → raw ArrayBuffer (Gemini reads layout, tables, images natively)
 * DOCX/DOC  → HTML via mammoth (preserves tables, headings, bold/italic, lists)
 * PNG/JPG   → raw ArrayBuffer (Gemini reads image natively)
 * PPTX      → slides extracted as images via pptx2png, or raw bytes as fallback
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
 * Parse a file and return { data, mimeType } for Gemini.
 *
 * Returns:
 *   { data: ArrayBuffer, mimeType: 'application/pdf'  }  — PDF
 *   { data: string,      mimeType: 'text/html'        }  — DOCX (HTML)
 *   { data: ArrayBuffer, mimeType: 'image/png'        }  — PNG
 *   { data: ArrayBuffer, mimeType: 'image/jpeg'       }  — JPG
 *   { data: ArrayBuffer, mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' } — PPTX
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
    return {
      data: await file.arrayBuffer(),
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    }
  }

  throw new Error('Unsupported file type. Please upload a PDF, DOCX, PPTX, PNG or JPG.')
}
