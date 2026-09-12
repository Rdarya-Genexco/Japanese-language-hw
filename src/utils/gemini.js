import { getLang } from './languages'

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert an ArrayBuffer to a base64 string (chunked to avoid stack overflow). */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  const CHUNK = 8192
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

// ── Prompt builders ───────────────────────────────────────────────────────────

function buildSystemInstruction(lang) {
  const isEnglish = lang.code === 'en'
  const targetDesc = isEnglish
    ? 'English (the target is English — the source worksheet may be in any language)'
    : lang.name

  return `You are a professional bilingual worksheet translator producing print-ready HTML.

TARGET LANGUAGE: ${targetDesc}

YOUR ONLY JOB: translate the document into ${targetDesc} and output a COMPLETE, SELF-CONTAINED HTML DOCUMENT — nothing else. Reproduce every element of the source exactly: if it is a syllabus, translate the syllabus; if it is a worksheet with questions, translate those questions. Never add, remove, or generate content.

WHAT YOU MUST NEVER DO:
• Never output JSON, markdown, plain text, or explanations — HTML ONLY
• Never add \`\`\`html fences — output raw HTML starting with <!DOCTYPE html>
• Never reorder, merge, split, add, or remove any question or section
• Never split a multi-part question (a) b) c)) into separate items
• Never combine separate numbered questions into one
• CRITICAL: Never generate, invent, or create questions, exercises, or tasks that do not already exist in the source document. If the input is a syllabus, course outline, notes, or any document with no questions — translate it exactly as-is into a clean HTML layout. Do not turn it into a question paper.

HTML REQUIREMENTS:
• Complete document: <!DOCTYPE html><html lang="${lang.code}">…</html>
• All CSS inside one <style> tag — NO external stylesheets, NO CDN links, NO JavaScript
• Font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, 'Hiragino Sans', 'Meiryo', 'Noto Sans JP', 'Noto Sans KR', 'Noto Sans SC', sans-serif
• Body: background #fff; color #111; max-width 860px; margin 0 auto; padding 28px 36px; line-height: 1.5
• Paragraphs and all text blocks: margin-top: 0; margin-bottom: 8pt; line-height: 1.5  (matches Word: Before 0pt / After 8pt / 1.5 lines)
• p, li, td, th, span { margin-top: 0; margin-bottom: 8pt; line-height: 1.5 }
• h1, h2, h3, h4 { margin-top: 0; margin-bottom: 8pt; line-height: 1.5 }
• Wrap EVERY question (stem + all its options/lines) in <div class="q-block"> with margin-bottom: 16pt and padding-bottom: 4pt so there is always whitespace between questions — this prevents questions from being sliced across page breaks when the PDF is generated
• Sections: padding 14px 16px; margin-bottom: 16pt
• @media print { body { margin: 1.27cm; padding: 0; } .no-print { display:none; } }

BILINGUAL SUBTITLE RULE (MANDATORY):
${isEnglish
  ? '• The target IS English — do NOT add any subtitle below questions. Output only the English translation, nothing else beneath each question.'
  : `• EVERY question stem MUST be immediately followed by the original English text as a subtitle — on its own line, inside the same q-block div, styled as: <div class="en-sub">original English text here</div>
• Add this CSS to your <style> tag: .en-sub { font-size: 0.82em; color: #777; font-style: italic; margin-top: 2pt; margin-bottom: 4pt; }
• Example structure for a non-English question:
  <div class="q-block">
    <p>1. フランスの首都はどこですか？</p>
    <div class="en-sub">1. What is the capital of France?</div>
    <div class="options">…</div>
  </div>
• If the source text IS already English, copy it as the subtitle unchanged. Never skip the subtitle on any question.`}

LAYOUT STRUCTURE:
• Header block: translated title (large bold), original-language title below in gray italic, subject / grade / total points as small pills
• Global instructions box (if any): light blue background, left border
• Sections: numbered circle badge + section title (bold) + section instructions (small italic)
• Questions: inside q-block — translated question first (dark, readable), then .en-sub subtitle${isEnglish ? ' (omitted for English target)' : ' (English source, always present)'}
• Answer spaces: horizontal ruled lines for short_answer/essay; leave blank table cells for matching right column; underlines for fill-in-the-blank

QUESTION TYPE FORMATTING:
• fill_blank: inline underline spans ___ where student writes; include translated text + answer key context
• multiple_choice: A B C D options listed below question, each on its own line with a leading circle ○
• true_false: question text + ○ True  ×/✗ False choice boxes on same line
• matching: two-column table — left: term (translated) with original below; right: blank box for student to write answer; add a shuffled word bank below the table
• ordering: numbered blank lines for student to write the sequence
• short_answer: 3 ruled lines below question
• essay: 6–8 ruled lines below question

TRANSLATION RULES:
• Translate with complete accuracy and natural ${targetDesc} fluency
• Preserve all numbers, symbols, units, formulas, equations exactly
• Keep question labels exactly: "a)", "b)", "1.", "(i)", etc.
• A question with sub-parts a) b) c) is ONE question — keep all sub-parts in one block

IMAGE EMBEDDING RULE (applies when the source is a photo or image file):
• Wherever the source image/photo belongs in the layout, output this EXACT tag — nothing else, no gray box, no bracket description: <img src="[WORKSHEET_IMAGE]" class="ws-photo" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:0 auto 12pt;box-shadow:0 2px 8px rgba(0,0,0,0.12);">
• The placeholder [WORKSHEET_IMAGE] will be replaced with the real image automatically — do NOT write a data URI yourself
• Do NOT wrap it in a gray div or write [Photo A: …] alt-text descriptions in brackets

DOCX EMBEDDED IMAGES: The source HTML may contain <img src="[DOCX_IMAGE_0]">, <img src="[DOCX_IMAGE_1]">, etc. where embedded images were. You MUST keep these <img> tags exactly as-is in your output — same src value, same position in the document. Do not remove, rename, or modify them.

OUTPUT: Start immediately with <!DOCTYPE html> — no preamble, no explanation.`
}

/**
 * System instruction for image-file uploads.
 * The worksheet is shown as a photo — students work from the original image.
 * Gemini's job is ONLY to translate the instructions/directions text, not to
 * recreate questions or content.
 */
function buildImageSystemInstruction(lang) {
  const isEnglish = lang.code === 'en'
  const targetDesc = isEnglish
    ? 'English'
    : lang.name

  return `You are a bilingual worksheet assistant producing print-ready HTML.

TARGET LANGUAGE: ${targetDesc}

YOUR ONLY JOB:
1. Embed the worksheet photo using the EXACT tag below (do not describe or recreate it).
2. Find every instruction or direction line in the image (e.g. "Circle the correct answer", "Match the following", "Fill in the blanks", section headings that tell students what to do) and translate ONLY those into ${targetDesc}.
3. Do NOT translate or reproduce individual questions, answer options, vocabulary items, or any worksheet content — students will read those directly from the photo.
4. Output a COMPLETE, SELF-CONTAINED HTML DOCUMENT — nothing else.

IMAGE TAG (use this exactly — do not write a data URI):
<img src="[WORKSHEET_IMAGE]" class="ws-photo" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:0 auto 16pt;box-shadow:0 2px 8px rgba(0,0,0,0.12);">

OUTPUT STRUCTURE:
• The photo must appear first, full-width, using the exact tag above.
• Below the photo: a clean "Instructions" block listing each translated instruction.
  - Each instruction on its own line, with the original English text in small gray italic beneath it.
  - If the source is already English, skip the gray italic line.
• No other content.

HTML REQUIREMENTS:
• Complete document: <!DOCTYPE html><html lang="${lang.code}">…</html>
• All CSS inside one <style> tag — NO external stylesheets, NO CDN links, NO JavaScript
• Font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, 'Hiragino Sans', 'Meiryo', sans-serif
• Body: background #fff; color #111; max-width 860px; margin 0 auto; padding 28px 36px
• Instructions block: background #f0f4ff; border-left: 4px solid #6366f1; border-radius: 6px; padding: 14px 18px; margin-top: 20pt
• Each instruction item: font-size 1em; margin-bottom: 10pt
• Original-language line: font-size: 0.82em; color: #888; font-style: italic; margin-top: 2pt
• @media print { body { margin: 1.27cm; padding: 0; } }

WHAT YOU MUST NEVER DO:
• Never output JSON, markdown, plain text, or explanations — HTML ONLY
• Never add \`\`\`html fences — output raw HTML starting with <!DOCTYPE html>
• Never recreate or list the questions, answer choices, or any worksheet body content
• Never write a data URI for the image — use [WORKSHEET_IMAGE] exactly

OUTPUT: Start immediately with <!DOCTYPE html> — no preamble, no explanation.`
}

function buildHtmlPrompt(lang) {
  return `Translate the document below into ${lang.name}.
Reproduce every element exactly as it appears — sections, headings, bullet points, questions, tables, notes. Do not add, remove, or rearrange anything.
Output a single complete self-contained HTML document — nothing else.

--- DOCUMENT CONTENT BELOW ---
`
}

// ── DOCX image extraction ─────────────────────────────────────────────────────

/**
 * Strip base64 data URIs out of <img> tags in DOCX-converted HTML and replace
 * them with numbered placeholders so Gemini doesn't see (or drop) large blobs.
 *
 * Returns { strippedHtml, imageUris } where imageUris[N] is the original data
 * URI for placeholder [DOCX_IMAGE_N].
 */
function extractDocxImages(html) {
  const imageUris = []
  const strippedHtml = html.replace(
    /<img(\s[^>]*)?\bsrc\s*=\s*"(data:[^"]+)"([^>]*)>/gi,
    (fullTag, before = '', dataUri, after = '') => {
      const idx = imageUris.length
      imageUris.push(dataUri)
      // Keep the img tag but replace the src with the placeholder text
      return `<img${before} src="[DOCX_IMAGE_${idx}]"${after}>`
    }
  )
  return { strippedHtml, imageUris }
}

/**
 * Re-inject extracted data URIs back into translated HTML by replacing
 * [DOCX_IMAGE_N] markers with the original base64 strings.
 */
function reInjectDocxImages(html, imageUris) {
  return imageUris.reduce((h, uri, idx) =>
    h.replace(new RegExp(`\\[DOCX_IMAGE_${idx}\\]`, 'g'), uri), html)
}

// ── Gemini API ────────────────────────────────────────────────────────────────

const DEFAULT_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

// Models in priority order — first available wins
const MODEL_CHAIN = [
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-pro',
]

const TIMEOUT_MS = 300_000 // 5 min — PDF+HTML is heavier than JSON; large files need extra headroom

async function callGemini(model, body, apiKey) {
  const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') throw new Error('AI processing timed out. Please try again.')
    throw err
  }
  clearTimeout(timer)
  return response
}

/**
 * Translate a worksheet with Gemini and return a complete HTML document string.
 *
 * @param {ArrayBuffer|string} fileData  Raw PDF bytes (ArrayBuffer) or extracted text (string)
 * @param {string} mimeType             'application/pdf' or 'text/plain'
 * @param {string|null} apiKey          Gemini API key (falls back to env var)
 * @param {string} langCode             Target language code, e.g. 'ja', 'en', 'fr'
 * @returns {Promise<string>}           Self-contained HTML document
 */
export async function processWorksheetWithGemini(fileData, mimeType, apiKey, langCode = 'ja', thumbnailDataUri = null) {
  if (!apiKey) apiKey = DEFAULT_API_KEY

  const lang = getLang(langCode)
  const IMAGE_MIME_TYPES_INPUT = ['image/png', 'image/jpeg']
  const isImageInput = IMAGE_MIME_TYPES_INPUT.includes(mimeType)

  // Images get a dedicated prompt: show photo + translate instructions only.
  // All other file types get the full translation prompt.
  const systemInstruction = isImageInput
    ? buildImageSystemInstruction(lang)
    : buildSystemInstruction(lang)
  const prompt = isImageInput
    ? `Translate the worksheet instructions in this image into ${lang.name}. Show the image first, then list only the translated instruction/direction lines below it.`
    : buildHtmlPrompt(lang)

  // For DOCX (text/html): strip embedded base64 images out before sending to Gemini.
  // Gemini ignores / drops large base64 blobs in plain text — we replace them with
  // numbered placeholders and re-inject after translation.
  let docxImageUris = []
  let processedFileData = fileData
  if (mimeType === 'text/html') {
    const { strippedHtml, imageUris } = extractDocxImages(String(fileData))
    processedFileData = strippedHtml
    docxImageUris = imageUris
  }

  // Build content parts: prompt text + file data
  const contentParts = []
  contentParts.push({ text: prompt })

  const BINARY_MIME_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
  ]

  if (thumbnailDataUri && IMAGE_MIME_TYPES_INPUT.includes(mimeType)) {
    // For images: send the pre-compressed thumbnail instead of the raw (possibly large) original.
    // This avoids timeouts on large uploads — Gemini still reads 800px images accurately.
    const commaIdx = thumbnailDataUri.indexOf(',')
    const meta      = thumbnailDataUri.slice(5, commaIdx)          // "image/jpeg;base64"
    const b64       = thumbnailDataUri.slice(commaIdx + 1)
    const thumbMime = meta.split(';')[0]                            // "image/jpeg"
    contentParts.push({ inline_data: { mime_type: thumbMime, data: b64 } })
  } else if (IMAGE_MIME_TYPES_INPUT.includes(mimeType) && fileData instanceof ArrayBuffer) {
    // No thumbnail — send raw bytes (fallback, large images may time out)
    const b64 = arrayBufferToBase64(fileData)
    contentParts.push({ inline_data: { mime_type: mimeType, data: b64 } })
  } else if (BINARY_MIME_TYPES.includes(mimeType) && fileData instanceof ArrayBuffer) {
    // PDF / PPTX / PPT — send raw bytes inline; Gemini reads these natively
    const b64 = arrayBufferToBase64(fileData)
    contentParts.push({ inline_data: { mime_type: mimeType, data: b64 } })
  } else if (mimeType === 'text/html') {
    // DOCX converted to HTML by mammoth — images already extracted above.
    // Tell Gemini it's HTML markup so it reads tables, headings, bold/italic properly.
    contentParts.push({ text: 'The worksheet content below is HTML extracted from a Word document. Read all structural elements (tables, headings, lists, bold text, and [DOCX_IMAGE_N] image placeholders) as part of the worksheet layout:\n\n' + processedFileData })
  } else {
    // Plain text fallback
    contentParts.push({ text: String(processedFileData) })
  }

  const body = {
    system_instruction: { parts: [{ text: systemInstruction }] },
    contents: [{ parts: contentParts }],
    generationConfig: {
      temperature: 0.1,
      // No responseMimeType restriction — we want HTML text back
    },
  }

  let lastErr = 'unknown error'

  for (const model of MODEL_CHAIN) {
    let response
    try {
      response = await callGemini(model, body, apiKey)
    } catch (err) {
      if (err.message === 'AI processing timed out. Please try again.') throw err
      throw new Error(`Network error: ${err.message}`)
    }

    // Overloaded / rate-limited → try next model
    if (response.status === 503 || response.status === 429) {
      const errBody = await response.json().catch(() => ({}))
      lastErr = errBody?.error?.message || `HTTP ${response.status}`
      console.warn(`[Gemini] ${model} unavailable (${response.status}), trying next…`)
      continue
    }

    // Model doesn't exist → try next
    if (response.status === 404) {
      const errBody = await response.json().catch(() => ({}))
      lastErr = errBody?.error?.message || `HTTP ${response.status}`
      console.warn(`[Gemini] ${model} not available (${response.status}), trying next…`)
      continue
    }

    // 400 Bad Request — invalid request body (bad API key format, bad payload, etc.)
    // This is a caller error, not a model-availability issue; throwing immediately is correct.
    if (response.status === 400) {
      const errBody = await response.json().catch(() => ({}))
      const msg = errBody?.error?.message || 'Bad request'
      throw new Error(`Gemini: ${msg}`)
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      const msg = err?.error?.message || `API error (${response.status})`
      throw new Error(`Gemini: ${msg}`)
    }

    const data = await response.json()
    let rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    if (!rawText) throw new Error('No response from AI. Please try again.')

    // Strip markdown fences if model wrapped output
    rawText = rawText.trim()
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim()
    }

    // Validate it looks like HTML
    if (!rawText.includes('<html') && !rawText.includes('<!DOCTYPE')) {
      // Wrap bare content in a minimal document
      rawText = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:24px 32px;color:#111}p{white-space:pre-wrap}</style></head><body>${rawText}</body></html>`
    }

    // Strip any <script> blocks — the iframe preview uses sandbox="allow-same-origin"
    // (no allow-scripts) so scripts would be blocked and Chrome logs a violation.
    // Worksheets never need JS; removing it keeps the CSP clean.
    rawText = rawText.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')

    // Re-inject DOCX embedded images — replace [DOCX_IMAGE_N] placeholders with
    // the original base64 data URIs that were extracted before sending to Gemini.
    if (docxImageUris.length > 0) {
      rawText = reInjectDocxImages(rawText, docxImageUris)
    }

    // Strip any leftover [WORKSHEET_IMAGE] placeholders from non-image inputs.
    // Gemini may output them even for PDFs/DOCXs because the rule is always in
    // the system prompt. For image inputs the placeholder is intentionally kept
    // so WorksheetViewer can inject the actual data URI client-side.
    // Keeping it as "[WORKSHEET_IMAGE]" in stored HTML is safe — the viewer
    // replaces it before rendering; if originalImageUri is missing it falls back
    // to removing the broken tag.
    if (!isImageInput && rawText.includes('[WORKSHEET_IMAGE]')) {
      rawText = rawText.replace(/<img\b[^>]*\[WORKSHEET_IMAGE\][^>]*>/gi, '')
      rawText = rawText.replace(/\[WORKSHEET_IMAGE\]/g, '')
    }

    // For image inputs: ensure the placeholder is present so the viewer can
    // inject the photo. If Gemini omitted it, inject it right after <body>.
    if (isImageInput && !rawText.includes('[WORKSHEET_IMAGE]')) {
      const placeholder = `<div style="text-align:center;margin-bottom:16pt"><img src="[WORKSHEET_IMAGE]" style="max-width:100%;height:auto;border-radius:6px;display:block;margin:0 auto 12pt;box-shadow:0 2px 8px rgba(0,0,0,0.12);"></div>`
      const lc = rawText.toLowerCase()
      const bodyStart = lc.indexOf('<body')
      if (bodyStart !== -1) {
        const bodyEnd = rawText.indexOf('>', bodyStart)
        if (bodyEnd !== -1) {
          rawText = rawText.slice(0, bodyEnd + 1) + '\n' + placeholder + rawText.slice(bodyEnd + 1)
        } else {
          rawText = placeholder + rawText
        }
      } else {
        rawText = placeholder + rawText
      }
    }

    return rawText  // HTML string
  }

  throw new Error(`All Gemini models are busy. Please try again in a moment. (${lastErr})`)
}
