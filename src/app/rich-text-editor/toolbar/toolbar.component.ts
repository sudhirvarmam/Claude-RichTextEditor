import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ElementRef,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ToolbarGroup,
  ToolbarAction,
  ToolbarActionType,
  DropdownOption,
  LinkData,
  TableConfig,
  EditorCommandExecutor,
} from '../models/editor.models';
import { ColorPickerComponent } from './color-picker/color-picker.component';
import { LinkDialogComponent } from './link-dialog/link-dialog.component';
import { TablePickerComponent } from './table-picker/table-picker.component';
import { ImageDialogComponent } from './image-dialog/image-dialog.component';

type ActiveDropdown = ToolbarActionType | null;

@Component({
  selector: 'rte-toolbar',
  standalone: true,
  imports: [
    CommonModule,
    ColorPickerComponent,
    LinkDialogComponent,
    TablePickerComponent,
    ImageDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rte-toolbar" role="toolbar" aria-label="Text formatting">
      @for (group of toolbarGroups; track group.id) {
        <div class="rte-toolbar-group" role="group" [attr.aria-label]="group.id">
          @for (action of group.actions; track action.type) {
            @if (action.type === 'separator') {
              <div class="rte-toolbar-separator" role="separator"></div>
            } @else if (action.dropdown) {
              <div class="rte-dropdown-wrapper">
                <button
                  type="button"
                  class="rte-toolbar-btn rte-toolbar-dropdown-btn"
                  [class.rte-toolbar-btn-active]="activeDropdown === action.type"
                  [title]="action.tooltip || action.label"
                  [attr.aria-label]="action.label"
                  [attr.aria-expanded]="activeDropdown === action.type"
                  (mousedown)="$event.preventDefault()"
                  (click)="toggleDropdown(action.type)"
                >
                  <span class="rte-btn-label">{{ getDropdownLabel(action) }}</span>
                  <span class="rte-dropdown-arrow">&#9662;</span>
                </button>
                @if (activeDropdown === action.type) {
                  <div class="rte-dropdown-panel" role="listbox">
                    @for (option of action.dropdown; track option.value) {
                      <button
                        type="button"
                        class="rte-dropdown-option"
                        [style]="option.style || {}"
                        role="option"
                        (mousedown)="$event.preventDefault()"
                        (click)="selectDropdownOption(action.type, option)"
                      >
                        {{ option.label }}
                      </button>
                    }
                  </div>
                }
              </div>
            } @else if (action.type === 'text-color' || action.type === 'bg-color') {
              <div class="rte-dropdown-wrapper">
                <button
                  type="button"
                  class="rte-toolbar-btn"
                  [class.rte-toolbar-btn-active]="activeDropdown === action.type"
                  [title]="action.tooltip || action.label"
                  [attr.aria-label]="action.label"
                  (mousedown)="$event.preventDefault()"
                  (click)="toggleDropdown(action.type)"
                >
                  <span class="rte-icon" [innerHTML]="getIcon(action.type)"></span>
                </button>
                @if (activeDropdown === action.type) {
                  <div class="rte-dropdown-panel rte-dropdown-panel-wide">
                    <rte-color-picker
                      [currentColor]="action.type === 'text-color' ? currentTextColor : currentBgColor"
                      (colorSelected)="onColorSelected(action.type, $event)"
                      (colorCleared)="onColorCleared(action.type)"
                    ></rte-color-picker>
                  </div>
                }
              </div>
            } @else if (action.type === 'link') {
              <div class="rte-dropdown-wrapper">
                <button
                  type="button"
                  class="rte-toolbar-btn"
                  [class.rte-toolbar-btn-active]="activeDropdown === 'link'"
                  [title]="action.tooltip || action.label"
                  [attr.aria-label]="action.label"
                  (mousedown)="$event.preventDefault()"
                  (click)="toggleDropdown('link')"
                >
                  <span class="rte-icon" [innerHTML]="getIcon(action.type)"></span>
                </button>
                @if (activeDropdown === 'link') {
                  <div class="rte-dropdown-panel rte-dropdown-panel-dialog">
                    <rte-link-dialog
                      [linkData]="currentLinkData"
                      [isEdit]="isEditingLink"
                      (insert)="onLinkInsert($event)"
                      (remove)="onLinkRemove()"
                      (cancel)="closeDropdown()"
                    ></rte-link-dialog>
                  </div>
                }
              </div>
            } @else if (action.type === 'image') {
              <div class="rte-dropdown-wrapper">
                <button
                  type="button"
                  class="rte-toolbar-btn"
                  [class.rte-toolbar-btn-active]="activeDropdown === 'image'"
                  [title]="action.tooltip || action.label"
                  [attr.aria-label]="action.label"
                  (mousedown)="$event.preventDefault()"
                  (click)="toggleDropdown('image')"
                >
                  <span class="rte-icon" [innerHTML]="getIcon(action.type)"></span>
                </button>
                @if (activeDropdown === 'image') {
                  <div class="rte-dropdown-panel rte-dropdown-panel-dialog">
                    <rte-image-dialog
                      (insertUrl)="onImageInsertUrl($event)"
                      (uploadFile)="onImageUploadFile($event)"
                      (cancel)="closeDropdown()"
                    ></rte-image-dialog>
                  </div>
                }
              </div>
            } @else if (action.type === 'table') {
              <div class="rte-dropdown-wrapper">
                <button
                  type="button"
                  class="rte-toolbar-btn"
                  [class.rte-toolbar-btn-active]="activeDropdown === 'table'"
                  [title]="action.tooltip || action.label"
                  [attr.aria-label]="action.label"
                  (mousedown)="$event.preventDefault()"
                  (click)="toggleDropdown('table')"
                >
                  <span class="rte-icon" [innerHTML]="getIcon(action.type)"></span>
                </button>
                @if (activeDropdown === 'table') {
                  <div class="rte-dropdown-panel">
                    <rte-table-picker
                      (tableSelected)="onTableSelected($event)"
                    ></rte-table-picker>
                  </div>
                }
              </div>
            } @else {
              <button
                type="button"
                class="rte-toolbar-btn"
                [class.rte-toolbar-btn-active]="isActionActive(action.type)"
                [class.rte-toolbar-btn-disabled]="action.disabled"
                [disabled]="action.disabled"
                [title]="action.tooltip || action.label"
                [attr.aria-label]="action.label"
                [attr.aria-pressed]="isActionActive(action.type)"
                (mousedown)="$event.preventDefault()"
                (click)="onAction(action)"
              >
                <span class="rte-icon" [innerHTML]="getIcon(action.type)"></span>
              </button>
            }
          }
        </div>
        <div class="rte-toolbar-separator" role="separator"></div>
      }

      <!-- Custom plugin toolbar actions -->
      @if (customActions.length > 0) {
        <div class="rte-toolbar-group" role="group" aria-label="Extensions">
          @for (action of customActions; track action.customId || action.label) {
            <button
              type="button"
              class="rte-toolbar-btn"
              [title]="action.tooltip || action.label"
              [attr.aria-label]="action.label"
              (mousedown)="$event.preventDefault()"
              (click)="onCustomAction(action)"
            >
              @if (action.icon) {
                <span class="rte-icon" [innerHTML]="action.icon"></span>
              } @else {
                <span class="rte-btn-label">{{ action.label }}</span>
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .rte-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      padding: 4px 8px;
      border-bottom: 1px solid var(--rte-border-color, #ddd);
      background: var(--rte-toolbar-bg, #fafafa);
      gap: 2px;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .rte-toolbar-group {
      display: flex;
      align-items: center;
      gap: 1px;
    }
    .rte-toolbar-separator {
      width: 1px;
      height: 24px;
      background: var(--rte-border-color, #ddd);
      margin: 0 4px;
    }
    .rte-toolbar-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 30px;
      height: 30px;
      padding: 4px 6px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      color: var(--rte-icon-color, #444);
      transition: background-color 0.15s, color 0.15s;
      font-size: 13px;
    }
    .rte-toolbar-btn:hover:not(:disabled) {
      background: var(--rte-hover-bg, #e8e8e8);
    }
    .rte-toolbar-btn-active {
      background: var(--rte-active-bg, #d0e0ff) !important;
      color: var(--rte-primary, #1a73e8);
    }
    .rte-toolbar-btn-disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .rte-toolbar-dropdown-btn {
      padding: 4px 8px;
      gap: 4px;
    }
    .rte-btn-label {
      font-size: 12px;
      white-space: nowrap;
    }
    .rte-dropdown-arrow {
      font-size: 8px;
      opacity: 0.6;
    }
    .rte-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      font-size: 14px;
    }
    .rte-dropdown-wrapper {
      position: relative;
    }
    .rte-dropdown-panel {
      position: absolute;
      top: 100%;
      left: 0;
      margin-top: 4px;
      background: var(--rte-dropdown-bg, #fff);
      border: 1px solid var(--rte-border-color, #ddd);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      z-index: 100;
      max-height: 300px;
      overflow-y: auto;
    }
    .rte-dropdown-panel-wide {
      min-width: 240px;
    }
    .rte-dropdown-panel-dialog {
      min-width: 320px;
      overflow: visible;
    }
    .rte-dropdown-option {
      display: block;
      width: 100%;
      padding: 6px 12px;
      border: none;
      background: transparent;
      text-align: left;
      cursor: pointer;
      font-size: 13px;
      color: var(--rte-text, #333);
      white-space: nowrap;
    }
    .rte-dropdown-option:hover {
      background: var(--rte-hover-bg, #f0f0f0);
    }
  `],
})
export class ToolbarComponent implements OnDestroy {
  @Input() toolbarGroups: ToolbarGroup[] = [];
  @Input() customActions: ToolbarAction[] = [];
  @Input() editor: EditorCommandExecutor | null = null;

  // Active state tracking
  @Input() activeStates: Record<string, boolean> = {};
  @Input() currentTextColor: string | null = null;
  @Input() currentBgColor: string | null = null;

  // Outputs
  @Output() actionExecuted = new EventEmitter<{ type: ToolbarActionType; value?: string }>();
  @Output() linkInsert = new EventEmitter<LinkData>();
  @Output() linkRemove = new EventEmitter<void>();
  @Output() tableInsert = new EventEmitter<TableConfig>();
  @Output() imageInsertFromUrl = new EventEmitter<{ url: string; alt: string }>();
  @Output() imageUploadFromFile = new EventEmitter<File>();
  @Output() colorChange = new EventEmitter<{ type: 'text' | 'bg'; color: string | null }>();
  @Output() customActionExecuted = new EventEmitter<ToolbarAction>();
  @Output() dropdownOpened = new EventEmitter<void>();

  activeDropdown: ActiveDropdown = null;
  currentLinkData: LinkData = { url: '', text: '', target: '_blank' };
  isEditingLink = false;

  constructor(
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef,
  ) {}

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.activeDropdown && !this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  ngOnDestroy(): void {
    this.closeDropdown();
  }

  toggleDropdown(type: ToolbarActionType): void {
    if (this.activeDropdown === type) {
      this.closeDropdown();
    } else {
      this.activeDropdown = type;
      this.dropdownOpened.emit();
      if (type === 'link') {
        this.prepareLinkDialog();
      }
      this.cdr.markForCheck();
    }
  }

  closeDropdown(): void {
    this.activeDropdown = null;
    this.cdr.markForCheck();
  }

  onAction(action: ToolbarAction): void {
    this.actionExecuted.emit({ type: action.type });
    if (action.execute && this.editor) {
      action.execute(this.editor);
    }
  }

  selectDropdownOption(type: ToolbarActionType, option: DropdownOption): void {
    this.actionExecuted.emit({ type, value: String(option.value) });
    this.closeDropdown();
  }

  onColorSelected(type: ToolbarActionType, color: string): void {
    this.colorChange.emit({
      type: type === 'text-color' ? 'text' : 'bg',
      color,
    });
    this.closeDropdown();
  }

  onColorCleared(type: ToolbarActionType): void {
    this.colorChange.emit({
      type: type === 'text-color' ? 'text' : 'bg',
      color: null,
    });
    this.closeDropdown();
  }

  onLinkInsert(linkData: LinkData): void {
    this.linkInsert.emit(linkData);
    this.closeDropdown();
  }

  onLinkRemove(): void {
    this.linkRemove.emit();
    this.closeDropdown();
  }

  onTableSelected(config: TableConfig): void {
    this.tableInsert.emit(config);
    this.closeDropdown();
  }

  onImageInsertUrl(data: { url: string; alt: string }): void {
    this.imageInsertFromUrl.emit(data);
    this.closeDropdown();
  }

  onImageUploadFile(file: File): void {
    this.imageUploadFromFile.emit(file);
    this.closeDropdown();
  }

  onCustomAction(action: ToolbarAction): void {
    this.customActionExecuted.emit(action);
    if (action.execute && this.editor) {
      action.execute(this.editor);
    }
  }

  isActionActive(type: ToolbarActionType): boolean {
    return this.activeStates[type] ?? false;
  }

  getDropdownLabel(action: ToolbarAction): string {
    if (action.type === 'heading') {
      const val = this.activeStates['formatBlock'] as unknown as string;
      if (val) {
        const found = action.dropdown?.find(o => o.value === val);
        if (found) return found.label;
      }
      return action.label;
    }
    return action.label;
  }

  getIcon(type: ToolbarActionType): string {
    const icons: Record<string, string> = {
      bold: '<b>B</b>',
      italic: '<i>I</i>',
      underline: '<u>U</u>',
      strike: '<s>S</s>',
      undo: '&#8617;',
      redo: '&#8618;',
      'align-left': '&#9776;',
      'align-center': '&#9776;',
      'align-right': '&#9776;',
      'align-justify': '&#9776;',
      'ordered-list': '1.',
      'unordered-list': '&bull;',
      indent: '&#8677;',
      outdent: '&#8676;',
      blockquote: '&#10077;',
      'code-inline': '&lt;/&gt;',
      'code-block': '&#9114;',
      link: '&#128279;',
      image: '&#128247;',
      table: '&#9638;',
      'text-color': '<b style="border-bottom:3px solid ' + (this.currentTextColor || '#000') + '">A</b>',
      'bg-color': '<span style="background:' + (this.currentBgColor || '#ff0') + ';padding:0 3px">A</span>',
      'clear-format': '&#120299;',
      'font-family': 'F',
      'font-size': 'T',
      heading: 'H',
    };
    return icons[type] || type;
  }

  updateActiveStates(states: Record<string, boolean>): void {
    this.activeStates = states;
    this.cdr.markForCheck();
  }

  private prepareLinkDialog(): void {
    // Check if cursor is inside a link
    if (this.editor) {
      const sel = this.editor.getSelection();
      if (sel && sel.rangeCount > 0) {
        const anchor = this.findParentTag(sel.anchorNode, 'A') as HTMLAnchorElement | null;
        if (anchor) {
          this.isEditingLink = true;
          this.currentLinkData = {
            url: anchor.href,
            text: anchor.textContent || '',
            target: (anchor.target as LinkData['target']) || '_self',
          };
        } else {
          this.isEditingLink = false;
          this.currentLinkData = {
            url: '',
            text: sel.toString() || '',
            target: '_blank',
          };
        }
      }
    }
  }

  private findParentTag(node: Node | null, tagName: string): HTMLElement | null {
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === tagName) {
        return node as HTMLElement;
      }
      node = node.parentNode;
    }
    return null;
  }
}
