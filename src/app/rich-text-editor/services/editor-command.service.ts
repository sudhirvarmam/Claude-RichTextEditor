import { Injectable } from '@angular/core';
import { EditorCommandExecutor, HistoryEntry } from '../models/editor.models';

/**
 * Core service that wraps document.execCommand and provides
 * selection management, undo/redo history, and HTML insertion.
 *
 * Implements EditorCommandExecutor so it can be passed to plugins.
 */
@Injectable()
export class EditorCommandService implements EditorCommandExecutor {
  private editorElement: HTMLElement | null = null;
  private savedRange: Range | null = null;

  // Undo/Redo history
  private history: HistoryEntry[] = [];
  private historyIndex = -1;
  private readonly maxHistory = 100;
  private isUndoRedoAction = false;

  setEditorElement(el: HTMLElement): void {
    this.editorElement = el;
  }

  // ─── Command Execution ───

  execCommand(command: string, value?: string): void {
    this.restoreSelection();
    document.execCommand(command, false, value ?? '');
    this.saveSelection();
  }

  queryCommandState(command: string): boolean {
    return document.queryCommandState(command);
  }

  queryCommandValue(command: string): string {
    return document.queryCommandValue(command);
  }

  // ─── Selection Management ───

  getSelection(): Selection | null {
    return window.getSelection();
  }

  saveSelection(): void {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      this.savedRange = sel.getRangeAt(0).cloneRange();
    }
  }

  restoreSelection(): void {
    if (this.savedRange && this.editorElement) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(this.savedRange);
      }
    }
  }

  clearSavedSelection(): void {
    this.savedRange = null;
  }

  // ─── Content ───

  getContent(): string {
    return this.editorElement?.innerHTML ?? '';
  }

  setContent(html: string): void {
    if (this.editorElement) {
      this.editorElement.innerHTML = html;
    }
  }

  getTextContent(): string {
    return this.editorElement?.textContent ?? '';
  }

  focus(): void {
    this.editorElement?.focus();
    this.restoreSelection();
  }

  // ─── HTML Insertion ───

  insertHtml(html: string): void {
    this.restoreSelection();
    // Use insertHTML command for cross-browser support
    document.execCommand('insertHTML', false, html);
    this.saveSelection();
  }

  // ─── Formatting Commands ───

  toggleBold(): void {
    this.execCommand('bold');
  }

  toggleItalic(): void {
    this.execCommand('italic');
  }

  toggleUnderline(): void {
    this.execCommand('underline');
  }

  toggleStrikethrough(): void {
    this.execCommand('strikeThrough');
  }

  setHeading(level: string): void {
    if (level === 'p') {
      this.execCommand('formatBlock', 'p');
    } else {
      this.execCommand('formatBlock', level);
    }
  }

  setAlignment(align: string): void {
    const commandMap: Record<string, string> = {
      left: 'justifyLeft',
      center: 'justifyCenter',
      right: 'justifyRight',
      justify: 'justifyFull',
    };
    const command = commandMap[align];
    if (command) {
      this.execCommand(command);
    }
  }

  toggleOrderedList(): void {
    this.execCommand('insertOrderedList');
  }

  toggleUnorderedList(): void {
    this.execCommand('insertUnorderedList');
  }

  indent(): void {
    this.execCommand('indent');
  }

  outdent(): void {
    this.execCommand('outdent');
  }

  toggleBlockquote(): void {
    const current = document.queryCommandValue('formatBlock');
    if (current === 'blockquote') {
      this.execCommand('formatBlock', 'p');
    } else {
      this.execCommand('formatBlock', 'blockquote');
    }
  }

  toggleInlineCode(): void {
    const sel = this.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const parentCode = this.findParentTag(range.commonAncestorContainer, 'CODE');

    if (parentCode) {
      // Remove code tag
      const parent = parentCode.parentNode;
      if (parent) {
        while (parentCode.firstChild) {
          parent.insertBefore(parentCode.firstChild, parentCode);
        }
        parent.removeChild(parentCode);
      }
    } else {
      const text = sel.toString();
      if (text) {
        const code = document.createElement('code');
        code.textContent = text;
        range.deleteContents();
        range.insertNode(code);
        // Move cursor after
        range.setStartAfter(code);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    this.saveSelection();
  }

  insertCodeBlock(): void {
    this.restoreSelection();
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = this.getSelection()?.toString() || '\n';
    pre.appendChild(code);
    this.insertHtml(pre.outerHTML);
  }

  setFontFamily(family: string): void {
    if (family) {
      this.execCommand('fontName', family);
    }
  }

  setFontSize(size: string): void {
    if (size) {
      this.execCommand('fontSize', size);
    }
  }

  setTextColor(color: string): void {
    this.execCommand('foreColor', color);
  }

  setBackgroundColor(color: string): void {
    this.execCommand('hiliteColor', color);
  }

  clearFormatting(): void {
    this.execCommand('removeFormat');
    // Also remove block formatting
    this.execCommand('formatBlock', 'p');
  }

  // ─── Link ───

  insertLink(url: string, text?: string, target = '_blank'): void {
    this.restoreSelection();
    const sel = this.getSelection();
    if (!sel) return;

    const selectedText = sel.toString();
    const linkText = text || selectedText || url;

    const a = document.createElement('a');
    a.href = url;
    a.textContent = linkText;
    if (target) {
      a.target = target;
      a.rel = 'noopener noreferrer';
    }

    if (selectedText) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(a);
    } else {
      this.insertHtml(a.outerHTML);
    }
    this.saveSelection();
  }

  removeLink(): void {
    this.execCommand('unlink');
  }

  // ─── Undo / Redo ───

  pushToHistory(html: string): void {
    if (this.isUndoRedoAction) return;

    // Remove entries after current index (discard redo stack on new change)
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    // Avoid duplicate entries
    if (this.history.length > 0 && this.history[this.history.length - 1].html === html) {
      return;
    }

    this.history.push({ html, timestamp: Date.now() });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    this.historyIndex = this.history.length - 1;
  }

  undo(): string | null {
    if (this.historyIndex > 0) {
      this.isUndoRedoAction = true;
      this.historyIndex--;
      const entry = this.history[this.historyIndex];
      this.isUndoRedoAction = false;
      return entry.html;
    }
    return null;
  }

  redo(): string | null {
    if (this.historyIndex < this.history.length - 1) {
      this.isUndoRedoAction = true;
      this.historyIndex++;
      const entry = this.history[this.historyIndex];
      this.isUndoRedoAction = false;
      return entry.html;
    }
    return null;
  }

  get canUndo(): boolean {
    return this.historyIndex > 0;
  }

  get canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  // ─── Helpers ───

  private findParentTag(node: Node | null, tagName: string): HTMLElement | null {
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === tagName) {
        return node as HTMLElement;
      }
      if (node === this.editorElement) return null;
      node = node.parentNode;
    }
    return null;
  }
}
