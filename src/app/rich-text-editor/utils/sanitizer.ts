/**
 * HTML sanitizer utility for XSS protection.
 * Strips dangerous tags, attributes, and protocols.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr', 'span', 'div',
  'b', 'i', 'u', 's', 'em', 'strong', 'del', 'ins', 'sub', 'sup',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'pre', 'code',
  'a', 'img',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'figure', 'figcaption',
]);

const ALLOWED_ATTRS = new Set([
  'class', 'id', 'style', 'title', 'dir', 'lang',
  'href', 'target', 'rel',
  'src', 'alt', 'width', 'height', 'loading',
  'colspan', 'rowspan', 'scope',
  'data-alignment', 'data-caption', 'data-image-id',
  'contenteditable',
]);

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:', 'data:']);

const DANGEROUS_STYLE_PATTERNS = [
  /expression\s*\(/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /-moz-binding/i,
  /behavior\s*:/i,
  /url\s*\(\s*['"]*\s*javascript/i,
];

function sanitizeStyle(style: string): string {
  for (const pattern of DANGEROUS_STYLE_PATTERNS) {
    if (pattern.test(style)) {
      return '';
    }
  }
  return style;
}

function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url, 'https://placeholder.com');
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
      return '';
    }
    return url;
  } catch {
    // Allow relative URLs and fragment-only URLs
    if (url.startsWith('#') || url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return url;
    }
    return '';
  }
}

/**
 * Sanitizes HTML string to prevent XSS attacks.
 * Uses the browser's DOMParser for robust parsing, then walks the tree
 * to remove disallowed elements and attributes.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  sanitizeNode(doc.body);
  return doc.body.innerHTML;
}

function sanitizeNode(node: Node): void {
  const childNodes = Array.from(node.childNodes);

  for (const child of childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tagName = el.tagName.toLowerCase();

      if (!ALLOWED_TAGS.has(tagName)) {
        // Replace with children (unwrap) for non-dangerous tags, remove entirely for script/style
        if (tagName === 'script' || tagName === 'style' || tagName === 'iframe' || tagName === 'object' || tagName === 'embed') {
          node.removeChild(child);
        } else {
          // Unwrap: move children up
          while (el.firstChild) {
            node.insertBefore(el.firstChild, el);
          }
          node.removeChild(el);
        }
        continue;
      }

      // Remove disallowed attributes
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        if (!ALLOWED_ATTRS.has(attr.name) && !attr.name.startsWith('data-')) {
          el.removeAttribute(attr.name);
          continue;
        }

        // Sanitize specific attributes
        if (attr.name === 'href' || attr.name === 'src') {
          const sanitized = sanitizeUrl(attr.value);
          if (!sanitized) {
            el.removeAttribute(attr.name);
          } else {
            el.setAttribute(attr.name, sanitized);
          }
        }

        if (attr.name === 'style') {
          const sanitized = sanitizeStyle(attr.value);
          if (!sanitized) {
            el.removeAttribute(attr.name);
          } else {
            el.setAttribute(attr.name, sanitized);
          }
        }
      }

      // Force rel="noopener noreferrer" on external links
      if (tagName === 'a' && el.getAttribute('target') === '_blank') {
        el.setAttribute('rel', 'noopener noreferrer');
      }

      // Recurse
      sanitizeNode(el);
    } else if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child);
    }
  }
}
