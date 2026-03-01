import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {
  EditorCommandExecutor,
  EditorImageResizeEvent,
  EditorImageUploadEvent,
  ImageAlignment,
  ImageConfig,
} from '../models/editor.models';

/**
 * Image Handler Service.
 * Manages image insertion (upload, drag-drop, paste, URL), resizing,
 * alignment, captions, and deletion.
 */
@Injectable()
export class ImageHandlerService {
  private editor: EditorCommandExecutor | null = null;
  private editorElement: HTMLElement | null = null;
  private config: ImageConfig = {};
  private imageCounter = 0;

  // Resize state
  private resizingImage: HTMLImageElement | null = null;
  private resizeStartX = 0;
  private resizeStartY = 0;
  private resizeStartWidth = 0;
  private resizeStartHeight = 0;
  private resizeHandle: HTMLElement | null = null;

  // Events
  readonly imageUpload$ = new Subject<EditorImageUploadEvent>();
  readonly imageResize$ = new Subject<EditorImageResizeEvent>();

  // Bound handlers for cleanup
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundMouseUp: ((e: MouseEvent) => void) | null = null;

  init(editor: EditorCommandExecutor, editorEl: HTMLElement, config: ImageConfig): void {
    this.editor = editor;
    this.editorElement = editorEl;
    this.config = config;
  }

  // ─── Insert Image via URL ───

  insertImageFromUrl(url: string, alt = ''): void {
    if (!this.editor) return;
    const imageId = this.generateImageId();
    const lazyAttr = this.config.enableLazyLoading ? ' loading="lazy"' : '';
    const maxWidth = this.config.maxWidth ? `max-width: ${this.config.maxWidth}px;` : '';

    let html = `<figure data-image-id="${imageId}" contenteditable="false" class="rte-image-wrapper" data-alignment="center">`;
    html += `<img src="${url}" alt="${alt}" data-image-id="${imageId}" style="${maxWidth}"${lazyAttr}>`;
    if (this.config.enableCaption) {
      html += `<figcaption contenteditable="true" class="rte-image-caption" data-placeholder="Add a caption..."></figcaption>`;
    }
    html += `</figure><p><br></p>`;

    this.editor.insertHtml(html);
    this.setupImageInteractions();
  }

  // ─── File Upload ───

  async handleFileUpload(file: File): Promise<void> {
    if (!this.validateFile(file)) return;

    this.imageUpload$.next({ file, progress: 0 });

    try {
      let url: string;
      if (this.config.uploadFn) {
        url = await this.config.uploadFn(file);
      } else {
        // Fallback to base64 data URL
        url = await this.fileToDataUrl(file);
      }

      this.imageUpload$.next({ file, url, progress: 100 });
      this.insertImageFromUrl(url, file.name);
    } catch (error) {
      console.error('Image upload failed:', error);
      this.imageUpload$.next({ file, progress: -1 });
    }
  }

  // ─── Drag & Drop ───

  handleDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (this.isImageFile(file)) {
        // Set caret position to drop location
        const range = this.getRangeFromDropEvent(event);
        if (range) {
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          this.editor?.saveSelection();
        }
        this.handleFileUpload(file);
      }
    }
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  // ─── Paste ───

  handlePaste(event: ClipboardEvent): boolean {
    const items = event.clipboardData?.items;
    if (!items) return false;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        event.preventDefault();
        const file = item.getAsFile();
        if (file) {
          this.handleFileUpload(file);
        }
        return true;
      }
    }
    return false;
  }

  // ─── Resize ───

  setupImageInteractions(): void {
    if (!this.editorElement) return;

    // Use event delegation
    this.editorElement.addEventListener('click', (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' && target.closest('.rte-image-wrapper')) {
        this.selectImage(target as HTMLImageElement);
      } else if (!target.closest('.rte-image-selected') && !target.closest('.rte-image-toolbar')) {
        this.deselectAllImages();
      }
    });
  }

  selectImage(img: HTMLImageElement): void {
    this.deselectAllImages();

    const wrapper = img.closest('.rte-image-wrapper') as HTMLElement;
    if (!wrapper) return;

    wrapper.classList.add('rte-image-selected');

    // Add resize handles
    if (this.config.enableResize) {
      this.addResizeHandles(wrapper, img);
    }

    // Add image toolbar
    this.addImageToolbar(wrapper, img);
  }

  deselectAllImages(): void {
    if (!this.editorElement) return;
    const selected = this.editorElement.querySelectorAll('.rte-image-selected');
    selected.forEach(el => {
      el.classList.remove('rte-image-selected');
      // Remove handles and toolbar
      el.querySelectorAll('.rte-resize-handle, .rte-image-toolbar').forEach(h => h.remove());
    });
  }

  private addResizeHandles(wrapper: HTMLElement, img: HTMLImageElement): void {
    const positions = ['nw', 'ne', 'sw', 'se'];
    positions.forEach(pos => {
      const handle = document.createElement('div');
      handle.className = `rte-resize-handle rte-resize-${pos}`;
      handle.setAttribute('data-position', pos);
      handle.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        this.startResize(e, img, handle);
      });
      wrapper.appendChild(handle);
    });
  }

  private addImageToolbar(wrapper: HTMLElement, img: HTMLImageElement): void {
    const toolbar = document.createElement('div');
    toolbar.className = 'rte-image-toolbar';
    toolbar.contentEditable = 'false';

    const buttons: { icon: string; title: string; action: () => void }[] = [
      { icon: '◀', title: 'Align Left', action: () => this.setImageAlignment(wrapper, 'left') },
      { icon: '◆', title: 'Align Center', action: () => this.setImageAlignment(wrapper, 'center') },
      { icon: '▶', title: 'Align Right', action: () => this.setImageAlignment(wrapper, 'right') },
      { icon: '✕', title: 'Delete Image', action: () => this.deleteImage(wrapper) },
    ];

    buttons.forEach(({ icon, title, action }) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rte-image-toolbar-btn';
      btn.title = title;
      btn.textContent = icon;
      btn.addEventListener('click', (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        action();
      });
      toolbar.appendChild(btn);
    });

    wrapper.appendChild(toolbar);
  }

  private startResize(event: MouseEvent, img: HTMLImageElement, handle: HTMLElement): void {
    this.resizingImage = img;
    this.resizeHandle = handle;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;
    this.resizeStartWidth = img.offsetWidth;
    this.resizeStartHeight = img.offsetHeight;

    this.boundMouseMove = this.onResizeMove.bind(this);
    this.boundMouseUp = this.onResizeEnd.bind(this);

    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseup', this.boundMouseUp);
    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';
  }

  private onResizeMove(event: MouseEvent): void {
    if (!this.resizingImage || !this.resizeHandle) return;

    const pos = this.resizeHandle.getAttribute('data-position') || 'se';
    let dx = event.clientX - this.resizeStartX;
    let dy = event.clientY - this.resizeStartY;

    // Invert delta for left-side handles
    if (pos.includes('w')) dx = -dx;
    if (pos.includes('n')) dy = -dy;

    let newWidth = this.resizeStartWidth + dx;
    let newHeight = this.resizeStartHeight + dy;

    // Maintain aspect ratio
    if (this.config.maintainAspectRatio) {
      const ratio = this.resizeStartWidth / this.resizeStartHeight;
      if (Math.abs(dx) > Math.abs(dy)) {
        newHeight = newWidth / ratio;
      } else {
        newWidth = newHeight * ratio;
      }
    }

    // Enforce constraints
    const minSize = 50;
    newWidth = Math.max(minSize, newWidth);
    newHeight = Math.max(minSize, newHeight);

    if (this.config.maxWidth) {
      newWidth = Math.min(this.config.maxWidth, newWidth);
      if (this.config.maintainAspectRatio) {
        newHeight = newWidth / (this.resizeStartWidth / this.resizeStartHeight);
      }
    }

    this.resizingImage.style.width = `${Math.round(newWidth)}px`;
    this.resizingImage.style.height = `${Math.round(newHeight)}px`;
  }

  private onResizeEnd(): void {
    if (this.resizingImage) {
      this.imageResize$.next({
        src: this.resizingImage.src,
        width: this.resizingImage.offsetWidth,
        height: this.resizingImage.offsetHeight,
        previousWidth: this.resizeStartWidth,
        previousHeight: this.resizeStartHeight,
      });
    }

    if (this.boundMouseMove) {
      document.removeEventListener('mousemove', this.boundMouseMove);
    }
    if (this.boundMouseUp) {
      document.removeEventListener('mouseup', this.boundMouseUp);
    }

    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    this.resizingImage = null;
    this.resizeHandle = null;
  }

  // ─── Alignment ───

  setImageAlignment(wrapper: HTMLElement, alignment: ImageAlignment): void {
    wrapper.setAttribute('data-alignment', alignment);
    wrapper.className = `rte-image-wrapper rte-image-selected rte-image-${alignment}`;
  }

  // ─── Delete ───

  deleteImage(wrapper: HTMLElement): void {
    const nextSibling = wrapper.nextSibling;
    wrapper.remove();
    // If there's no next paragraph, add one
    if (!nextSibling && this.editorElement) {
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      this.editorElement.appendChild(p);
    }
  }

  // ─── Validation ───

  private validateFile(file: File): boolean {
    if (!this.isImageFile(file)) {
      console.warn(`File type ${file.type} is not an allowed image type.`);
      return false;
    }
    if (this.config.maxFileSize && file.size > this.config.maxFileSize) {
      console.warn(`File size ${file.size} exceeds max ${this.config.maxFileSize}.`);
      return false;
    }
    return true;
  }

  private isImageFile(file: File): boolean {
    if (this.config.allowedTypes && this.config.allowedTypes.length > 0) {
      return this.config.allowedTypes.includes(file.type);
    }
    return file.type.startsWith('image/');
  }

  // ─── Helpers ───

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private generateImageId(): string {
    return `rte-img-${++this.imageCounter}-${Date.now()}`;
  }

  private getRangeFromDropEvent(event: DragEvent): Range | null {
    if (document.caretRangeFromPoint) {
      return document.caretRangeFromPoint(event.clientX, event.clientY);
    }
    return null;
  }

  destroy(): void {
    this.deselectAllImages();
    if (this.boundMouseMove) {
      document.removeEventListener('mousemove', this.boundMouseMove);
    }
    if (this.boundMouseUp) {
      document.removeEventListener('mouseup', this.boundMouseUp);
    }
    this.imageUpload$.complete();
    this.imageResize$.complete();
  }
}
