/**
 * Parse an uploaded file for Gemini.
 *
 * PDF  → returns raw ArrayBuffer so Gemini can see the actual visual layout.
 * DOCX → converts to HTML via mammoth (preserves tables, headings, bold/italic,
 *         lists) so Gemini sees structural markup instead of stripped plain text.
 */

export async function extractDocxHtml(file) {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.convertToHtml({ arrayBuffer })
  if (!result.value || result.value.trim().length === 0) {
    throw new Error('Could not extract content from DOCX file.')
  }
  return result.value   // HTML string with tables, headings, bold, lists, etc.
}

/**
 * Parse a file and return data for Gemini.
 *
 * Returns:
 *   { data: ArrayBuffer, mimeType: 'application/pdf' }   — for PDF
 *   { data: string,      mimeType: 'text/html'       }   — for DOCX (structured HTML)
 */
export async function parseFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()

  if (ext === 'pdf') {
    const arrayBuffer = await file.arrayBuffer()
    return { data: arrayBuffer, mimeType: 'application/pdf' }
  } else if (ext === 'docx' || ext === 'doc') {
    const html = await extractDocxHtml(file)
    return { data: html, mimeType: 'text/html' }
  } else {
    throw new Error('Only PDF or DOCX files are supported.')
  }
}
