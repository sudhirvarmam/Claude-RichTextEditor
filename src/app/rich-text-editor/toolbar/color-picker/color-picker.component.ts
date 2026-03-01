import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

const PRESET_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
  '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
  '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130',
];

@Component({
  selector: 'rte-color-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rte-color-picker" role="dialog" aria-label="Color picker">
      <div class="rte-color-grid">
        @for (color of colors; track color) {
          <button
            type="button"
            class="rte-color-swatch"
            [style.background-color]="color"
            [title]="color"
            [attr.aria-label]="'Color ' + color"
            (click)="selectColor(color)"
          ></button>
        }
      </div>
      <div class="rte-color-custom">
        <label class="rte-color-custom-label">
          Custom:
          <input
            type="color"
            [value]="currentColor || '#000000'"
            (input)="selectColor($any($event.target).value)"
            class="rte-color-input"
            aria-label="Custom color"
          >
        </label>
        @if (showClear) {
          <button
            type="button"
            class="rte-color-clear"
            (click)="clearColor()"
            aria-label="Remove color"
          >
            Remove
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .rte-color-picker {
      padding: 8px;
      background: var(--rte-dropdown-bg, #fff);
      border-radius: 4px;
      width: 220px;
    }
    .rte-color-grid {
      display: grid;
      grid-template-columns: repeat(10, 1fr);
      gap: 2px;
    }
    .rte-color-swatch {
      width: 20px;
      height: 20px;
      border: 1px solid var(--rte-border-color, #ddd);
      border-radius: 2px;
      cursor: pointer;
      padding: 0;
      transition: transform 0.1s;
    }
    .rte-color-swatch:hover {
      transform: scale(1.2);
      z-index: 1;
      border-color: var(--rte-primary, #1a73e8);
    }
    .rte-color-custom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--rte-border-color, #ddd);
    }
    .rte-color-custom-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--rte-text, #333);
    }
    .rte-color-input {
      width: 28px;
      height: 28px;
      border: 1px solid var(--rte-border-color, #ddd);
      border-radius: 4px;
      cursor: pointer;
      padding: 0;
    }
    .rte-color-clear {
      font-size: 12px;
      border: none;
      background: none;
      color: var(--rte-primary, #1a73e8);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
    }
    .rte-color-clear:hover {
      background: var(--rte-hover-bg, #f0f0f0);
    }
  `],
})
export class ColorPickerComponent {
  @Input() currentColor: string | null = null;
  @Input() showClear = true;
  @Output() colorSelected = new EventEmitter<string>();
  @Output() colorCleared = new EventEmitter<void>();

  colors = PRESET_COLORS;

  selectColor(color: string): void {
    this.colorSelected.emit(color);
  }

  clearColor(): void {
    this.colorCleared.emit();
  }
}
