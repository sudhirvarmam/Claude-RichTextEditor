import { EditorCommandService } from './editor-command.service';

describe('EditorCommandService', () => {
  let service: EditorCommandService;
  let editorEl: HTMLDivElement;

  beforeEach(() => {
    service = new EditorCommandService();
    editorEl = document.createElement('div');
    editorEl.contentEditable = 'true';
    editorEl.innerHTML = '<p>Test content</p>';
    document.body.appendChild(editorEl);
    service.setEditorElement(editorEl);
  });

  afterEach(() => {
    document.body.removeChild(editorEl);
  });

  it('should get content', () => {
    expect(service.getContent()).toBe('<p>Test content</p>');
  });

  it('should set content', () => {
    service.setContent('<p>New content</p>');
    expect(service.getContent()).toBe('<p>New content</p>');
  });

  it('should get text content', () => {
    expect(service.getTextContent()).toBe('Test content');
  });

  it('should focus the editor', () => {
    spyOn(editorEl, 'focus');
    service.focus();
    expect(editorEl.focus).toHaveBeenCalled();
  });

  // ─── Undo/Redo ───

  it('should track history', () => {
    service.pushToHistory('<p>State 1</p>');
    service.pushToHistory('<p>State 2</p>');
    service.pushToHistory('<p>State 3</p>');
    expect(service.canUndo).toBe(true);
    expect(service.canRedo).toBe(false);
  });

  it('should undo', () => {
    service.pushToHistory('<p>State 1</p>');
    service.pushToHistory('<p>State 2</p>');
    const result = service.undo();
    expect(result).toBe('<p>State 1</p>');
    expect(service.canRedo).toBe(true);
  });

  it('should redo', () => {
    service.pushToHistory('<p>State 1</p>');
    service.pushToHistory('<p>State 2</p>');
    service.undo();
    const result = service.redo();
    expect(result).toBe('<p>State 2</p>');
  });

  it('should return null when nothing to undo', () => {
    expect(service.undo()).toBeNull();
  });

  it('should return null when nothing to redo', () => {
    service.pushToHistory('<p>State 1</p>');
    expect(service.redo()).toBeNull();
  });

  it('should discard redo stack on new change after undo', () => {
    service.pushToHistory('<p>State 1</p>');
    service.pushToHistory('<p>State 2</p>');
    service.pushToHistory('<p>State 3</p>');
    service.undo();
    service.undo();
    service.pushToHistory('<p>State 2b</p>');
    expect(service.canRedo).toBe(false);
  });

  it('should not push duplicate entries', () => {
    service.pushToHistory('<p>Same</p>');
    service.pushToHistory('<p>Same</p>');
    expect(service.canUndo).toBe(false);
  });

  // ─── Selection ───

  it('should save and restore selection', () => {
    editorEl.focus();
    const range = document.createRange();
    range.selectNodeContents(editorEl.firstChild!.firstChild!);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    service.saveSelection();
    sel?.removeAllRanges();

    service.restoreSelection();
    const restoredSel = window.getSelection();
    expect(restoredSel?.rangeCount).toBeGreaterThan(0);
  });

  it('should clear saved selection', () => {
    service.saveSelection();
    service.clearSavedSelection();
    // Should not throw when restoring with no saved selection
    service.restoreSelection();
    expect(true).toBe(true);
  });
});
