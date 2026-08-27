/**
 * Sanitizes user-generated string inputs to prevent XSS injection,
 * safely trims whitespace, removes control/dangerous characters,
 * strips HTML/script tags, and handles special characters safely
 * before rendering into the DOM or passing to PDF generators.
 */

/**
 * Strips HTML tags, script elements, event handlers, and dangerous protocols
 * from user-generated text inputs.
 *
 * @param {any} input - Raw text input
 * @param {Object} options - Sanitization options
 * @param {boolean} [options.allowMultiline=false] - Whether to preserve newlines
 * @returns {string} - Cleaned and sanitized plain text
 */
export function sanitizeInput(input, options = {}) {
  if (input === null || input === undefined) return '';
  let str = String(input).trim();
  if (!str) return '';

  // 1. Remove NULL bytes and dangerous non-printable control characters
  if (options.allowMultiline) {
    str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  } else {
    str = str.replace(/[\x00-\x1F\x7F]/g, ' ');
  }

  // 2. Strip executable blocks and tags (script, iframe, style, object, embed, svg)
  str = str
    .replace(/<script\b[^<]*>(?:[\s\S]*?<\/script>)?/gi, '')
    .replace(/<iframe\b[^<]*>(?:[\s\S]*?<\/iframe>)?/gi, '')
    .replace(/<style\b[^<]*>(?:[\s\S]*?<\/style>)?/gi, '')
    .replace(/<object\b[^<]*>(?:[\s\S]*?<\/object>)?/gi, '')
    .replace(/<embed\b[^<]*>(?:[\s\S]*?<\/embed>)?/gi, '')
    .replace(/<svg\b[^<]*>(?:[\s\S]*?<\/svg>)?/gi, '');

  // 3. Remove inline event handlers (e.g. onerror=..., onload=...) and dangerous URI schemes
  str = str
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^ >]+/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/vbscript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '');

  // 4. Strip all HTML tags to enforce plain-text safety
  str = str.replace(/<[^>]*>/g, '');

  return str.trim();
}

/**
 * Escapes special HTML characters (&, <, >, ", ', /) for safe DOM/string embedding.
 *
 * @param {any} input - Input string
 * @returns {string} - HTML-escaped string
 */
export function escapeHtml(input) {
  const str = sanitizeInput(input, { allowMultiline: true });
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates and sanitizes image URLs, restricting protocols to http and https.
 * Prevents javascript: and data: URI XSS injection.
 *
 * @param {string} url - Target URL string
 * @returns {string} - Validated URL string or fallback empty string
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Block inline script protocols
  if (/^(javascript|vbscript|data):/i.test(trimmed)) {
    return '';
  }

  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
    return '';
  } catch (e) {
    // Relative image paths starting with /
    if (trimmed.startsWith('/')) {
      return trimmed;
    }
    return '';
  }
}

/**
 * Cleans string inputs specifically for PDF generation, removing non-ASCII/corrupting characters
 * and replacing symbols like ₹ with Rs.
 *
 * @param {any} input - Text input for PDF
 * @returns {string} - PDF-safe text string
 */
export function sanitizeForPDF(input) {
  const clean = sanitizeInput(input, { allowMultiline: true });
  return clean
    .replace(/₹/g, 'Rs. ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/•/g, '-')
    .replace(/[^\x00-\x7F]/g, '');
}
