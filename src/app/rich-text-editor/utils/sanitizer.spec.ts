import { sanitizeHtml } from './sanitizer';

describe('sanitizeHtml', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml(null as unknown as string)).toBe('');
  });

  it('should keep allowed tags', () => {
    const html = '<p>Hello <strong>world</strong></p>';
    expect(sanitizeHtml(html)).toBe(html);
  });

  it('should strip script tags', () => {
    const html = '<p>Hello</p><script>alert("xss")</script>';
    expect(sanitizeHtml(html)).toBe('<p>Hello</p>');
  });

  it('should strip iframe tags', () => {
    const html = '<p>Hello</p><iframe src="evil.com"></iframe>';
    expect(sanitizeHtml(html)).toBe('<p>Hello</p>');
  });

  it('should strip style tags', () => {
    const html = '<p>Hello</p><style>body { display:none; }</style>';
    expect(sanitizeHtml(html)).toBe('<p>Hello</p>');
  });

  it('should remove javascript: protocol from href', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">click</a>');
    expect(result).not.toContain('javascript:');
  });

  it('should allow safe href protocols', () => {
    expect(sanitizeHtml('<a href="https://example.com">link</a>'))
      .toContain('href="https://example.com"');
    expect(sanitizeHtml('<a href="mailto:test@test.com">email</a>'))
      .toContain('href="mailto:test@test.com"');
  });

  it('should remove on* event attributes', () => {
    const html = '<img src="test.jpg" onerror="alert(1)">';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('onerror');
  });

  it('should strip dangerous style expressions', () => {
    const html = '<div style="background: expression(alert(1))">test</div>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain('expression');
  });

  it('should remove HTML comments', () => {
    const html = '<p>Hello</p><!-- comment --><p>World</p>';
    expect(sanitizeHtml(html)).toBe('<p>Hello</p><p>World</p>');
  });

  it('should add noopener noreferrer to target _blank links', () => {
    const html = '<a href="https://test.com" target="_blank">link</a>';
    const result = sanitizeHtml(html);
    expect(result).toContain('rel="noopener noreferrer"');
  });

  it('should keep allowed attributes', () => {
    const html = '<div class="test" id="my-div" style="color: red;">content</div>';
    const result = sanitizeHtml(html);
    expect(result).toContain('class="test"');
    expect(result).toContain('style="color: red;"');
  });

  it('should keep data- attributes', () => {
    const html = '<div data-custom="value">content</div>';
    expect(sanitizeHtml(html)).toContain('data-custom="value"');
  });

  it('should unwrap non-allowed non-dangerous tags', () => {
    const html = '<div><span>valid</span><custom>text</custom></div>';
    const result = sanitizeHtml(html);
    expect(result).toContain('text');
    expect(result).not.toContain('<custom>');
  });

  it('should handle tables', () => {
    const html = '<table><tr><td>cell</td></tr></table>';
    expect(sanitizeHtml(html)).toContain('<table>');
    expect(sanitizeHtml(html)).toContain('<td>');
  });

  it('should handle images with loading attribute', () => {
    const html = '<img src="test.jpg" alt="test" loading="lazy">';
    const result = sanitizeHtml(html);
    expect(result).toContain('loading="lazy"');
    expect(result).toContain('alt="test"');
  });
});
