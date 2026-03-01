import {
  Component,
  EventEmitter,
  Output,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'rte-image-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rte-image-dialog" role="dialog" aria-label="Insert image">
      <div class="rte-dialog-header">Insert Image</div>

      <div class="rte-tab-bar">
        <button
          type="button"
          class="rte-tab"
          [class.rte-tab-active]="activeTab === 'url'"
          (click)="activeTab = 'url'"
        >
          URL
        </button>
        <button
          type="button"
          class="rte-tab"
          [class.rte-tab-active]="activeTab === 'upload'"
          (click)="activeTab = 'upload'"
        >
          Upload
        </button>
      </div>

      <div class="rte-dialog-body">
        @if (activeTab === 'url') {
          <div class="rte-form-group">
            <label for="imageUrl">Image URL</label>
            <input
              id="imageUrl"
              type="url"
              [(ngModel)]="imageUrl"
              placeholder="https://example.com/image.png"
              class="rte-input"
            >
          </div>
          <div class="rte-form-group">
            <label for="imageAlt">Alt text</label>
            <input
              id="imageAlt"
              type="text"
              [(ngModel)]="imageAlt"
              placeholder="Description of the image"
              class="rte-input"
            >
          </div>
        }

        @if (activeTab === 'upload') {
          <div
            class="rte-upload-zone"
            [class.rte-upload-zone-drag]="isDragOver"
            (dragover)="onDragOver($event)"
            (dragleave)="isDragOver = false"
            (drop)="onDrop($event)"
            (click)="fileInput.click()"
          >
            <div class="rte-upload-icon">&#128247;</div>
            <div class="rte-upload-text">
              Drag & drop an image here or click to browse
            </div>
            <input
              #fileInput
              type="file"
              accept="image/*"
              (change)="onFileSelected($event)"
              class="rte-upload-input"
              aria-label="Upload image file"
            >
          </div>
          @if (selectedFileName) {
            <div class="rte-selected-file">{{ selectedFileName }}</div>
          }
        }
      </div>

      <div class="rte-dialog-footer">
        <button type="button" class="rte-btn rte-btn-secondary" (click)="onCancel()">Cancel</button>
        @if (activeTab === 'url') {
          <button
            type="button"
            class="rte-btn rte-btn-primary"
            [disabled]="!imageUrl"
            (click)="insertFromUrl()"
          >
            Insert
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .rte-image-dialog {
      background: var(--rte-dropdown-bg, #fff);
      border-radius: 8px;
      padding: 16px;
      min-width: 360px;
    }
    .rte-dialog-header {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 12px;
      color: var(--rte-text, #333);
    }
    .rte-tab-bar {
      display: flex;
      border-bottom: 1px solid var(--rte-border-color, #ddd);
      margin-bottom: 12px;
    }
    .rte-tab {
      padding: 8px 16px;
      border: none;
      background: none;
      cursor: pointer;
      font-size: 13px;
      color: var(--rte-text-secondary, #666);
      border-bottom: 2px solid transparent;
      margin-bottom: -1px;
    }
    .rte-tab-active {
      color: var(--rte-primary, #1a73e8);
      border-bottom-color: var(--rte-primary, #1a73e8);
    }
    .rte-form-group {
      margin-bottom: 12px;
    }
    .rte-form-group label {
      display: block;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 4px;
      color: var(--rte-text-secondary, #666);
    }
    .rte-input {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid var(--rte-border-color, #ddd);
      border-radius: 4px;
      font-size: 13px;
      outline: none;
      background: var(--rte-input-bg, #fff);
      color: var(--rte-text, #333);
      box-sizing: border-box;
    }
    .rte-input:focus {
      border-color: var(--rte-primary, #1a73e8);
      box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.15);
    }
    .rte-upload-zone {
      border: 2px dashed var(--rte-border-color, #ddd);
      border-radius: 8px;
      padding: 32px 16px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .rte-upload-zone:hover, .rte-upload-zone-drag {
      border-color: var(--rte-primary, #1a73e8);
      background: rgba(26, 115, 232, 0.05);
    }
    .rte-upload-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    .rte-upload-text {
      font-size: 13px;
      color: var(--rte-text-secondary, #666);
    }
    .rte-upload-input {
      display: none;
    }
    .rte-selected-file {
      margin-top: 8px;
      font-size: 12px;
      color: var(--rte-text-secondary, #666);
      padding: 6px 10px;
      background: var(--rte-hover-bg, #f0f0f0);
      border-radius: 4px;
    }
    .rte-dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
    .rte-btn {
      padding: 6px 14px;
      border: none;
      border-radius: 4px;
      font-size: 13px;
      cursor: pointer;
      font-weight: 500;
    }
    .rte-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .rte-btn-primary {
      background: var(--rte-primary, #1a73e8);
      color: #fff;
    }
    .rte-btn-primary:hover:not(:disabled) {
      background: var(--rte-primary-dark, #1557b0);
    }
    .rte-btn-secondary {
      background: var(--rte-hover-bg, #f0f0f0);
      color: var(--rte-text, #333);
    }
    .rte-btn-secondary:hover {
      background: var(--rte-border-color, #ddd);
    }
  `],
})
export class ImageDialogComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  @Output() insertUrl = new EventEmitter<{ url: string; alt: string }>();
  @Output() uploadFile = new EventEmitter<File>();
  @Output() cancel = new EventEmitter<void>();

  activeTab: 'url' | 'upload' = 'url';
  imageUrl = '';
  imageAlt = '';
  isDragOver = false;
  selectedFileName = '';

  insertFromUrl(): void {
    if (this.imageUrl) {
      this.insertUrl.emit({ url: this.imageUrl, alt: this.imageAlt });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.uploadAndEmit(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const files = event.dataTransfer?.files;
    if (files?.length) {
      this.uploadAndEmit(files[0]);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private uploadAndEmit(file: File): void {
    this.selectedFileName = file.name;
    this.uploadFile.emit(file);
  }
}
