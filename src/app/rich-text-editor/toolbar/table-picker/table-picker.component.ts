import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableConfig } from '../../models/editor.models';

@Component({
  selector: 'rte-table-picker',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rte-table-picker" role="dialog" aria-label="Insert table">
      <div class="rte-table-grid">
        @for (row of rows; track row) {
          @for (col of cols; track col) {
            <div
              class="rte-table-cell"
              [class.rte-table-cell-active]="row <= hoverRow && col <= hoverCol"
              (mouseenter)="onHover(row, col)"
              (click)="onSelect(row, col)"
              role="gridcell"
              [attr.aria-label]="row + ' x ' + col"
            ></div>
          }
        }
      </div>
      <div class="rte-table-label">
        {{ hoverRow }} x {{ hoverCol }}
      </div>
    </div>
  `,
  styles: [`
    .rte-table-picker {
      padding: 8px;
      background: var(--rte-dropdown-bg, #fff);
      border-radius: 4px;
    }
    .rte-table-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 2px;
    }
    .rte-table-cell {
      width: 20px;
      height: 20px;
      border: 1px solid var(--rte-border-color, #ddd);
      border-radius: 2px;
      cursor: pointer;
      transition: background-color 0.1s;
    }
    .rte-table-cell-active {
      background: var(--rte-primary, #1a73e8);
      border-color: var(--rte-primary, #1a73e8);
    }
    .rte-table-label {
      text-align: center;
      font-size: 12px;
      margin-top: 4px;
      color: var(--rte-text-secondary, #666);
    }
  `],
})
export class TablePickerComponent {
  @Output() tableSelected = new EventEmitter<TableConfig>();

  rows = Array.from({ length: 8 }, (_, i) => i + 1);
  cols = Array.from({ length: 8 }, (_, i) => i + 1);
  hoverRow = 1;
  hoverCol = 1;

  onHover(row: number, col: number): void {
    this.hoverRow = row;
    this.hoverCol = col;
  }

  onSelect(rows: number, cols: number): void {
    this.tableSelected.emit({ rows, cols, headerRow: true });
  }
}
