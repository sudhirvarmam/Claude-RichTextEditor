import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LinkData } from '../../models/editor.models';

@Component({
  selector: 'rte-link-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rte-link-dialog" role="dialog" aria-label="Insert link">
      <div class="rte-dialog-header">
        <span>{{ isEdit ? 'Edit Link' : 'Insert Link' }}</span>
      </div>
      <div class="rte-dialog-body">
        <div class="rte-form-group">
          <label for="linkUrl">URL</label>
          <input
            id="linkUrl"
            type="url"
            [(ngModel)]="linkData.url"
            placeholder="https://example.com"
            class="rte-input"
            autofocus
          >
        </div>
        <div class="rte-form-group">
          <label for="linkText">Text</label>
          <input
            id="linkText"
            type="text"
            [(ngModel)]="linkData.text"
            placeholder="Link text"
            class="rte-input"
          >
        </div>
        <div class="rte-form-group">
          <label class="rte-checkbox-label">
            <input
              type="checkbox"
              [checked]="linkData.target === '_blank'"
              (change)="linkData.target = $any($event.target).checked ? '_blank' : '_self'"
            >
            Open in new tab
          </label>
        </div>
      </div>
      <div class="rte-dialog-footer">
        @if (isEdit) {
          <button type="button" class="rte-btn rte-btn-danger" (click)="onRemove()">Remove Link</button>
        }
        <button type="button" class="rte-btn rte-btn-secondary" (click)="onCancel()">Cancel</button>
        <button
          type="button"
          class="rte-btn rte-btn-primary"
          [disabled]="!linkData.url"
          (click)="onInsert()"
        >
          {{ isEdit ? 'Update' : 'Insert' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .rte-link-dialog {
      background: var(--rte-dropdown-bg, #fff);
      border-radius: 8px;
      padding: 16px;
      min-width: 320px;
    }
    .rte-dialog-header {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 12px;
      color: var(--rte-text, #333);
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
    .rte-checkbox-label {
      display: flex !important;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      font-size: 13px !important;
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
    .rte-btn-danger {
      background: #d93025;
      color: #fff;
      margin-right: auto;
    }
    .rte-btn-danger:hover {
      background: #b7231c;
    }
  `],
})
export class LinkDialogComponent {
  @Input() isEdit = false;
  @Input() linkData: LinkData = { url: '', text: '', target: '_blank' };
  @Output() insert = new EventEmitter<LinkData>();
  @Output() remove = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onInsert(): void {
    if (this.linkData.url) {
      this.insert.emit({ ...this.linkData });
    }
  }

  onRemove(): void {
    this.remove.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
