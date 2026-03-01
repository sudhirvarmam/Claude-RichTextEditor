import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NG_VALUE_ACCESSOR,
  ControlValueAccessor,
} from '@angular/forms';
import { Subject, fromEvent, merge } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import {
  EditorConfig,
  EditorChangeEvent,
  EditorImageUploadEvent,
  EditorImageResizeEvent,
  EditorPlugin,
  LinkData,
  TableConfig,
  ToolbarAction,
  ToolbarActionType,
  ToolbarGroup,
  DEFAULT_EDITOR_CONFIG,
} from '../models/editor.models';
import { DEFAULT_TOOLBAR_GROUPS } from '../models/toolbar-config';
import { sanitizeHtml } from '../utils/sanitizer';
import { EditorCommandService } from '../services/editor-command.service';
import { ImageHandlerService } from '../services/image-handler.service';
import { PluginRegistryService } from '../services/plugin-registry.service';
import { ToolbarComponent } from '../toolbar/toolbar.component';

@Component({
  selector: 'rte-editor',
  standalone: true,
  imports: [CommonModule, ToolbarComponent],
  providers: [
    EditorCommandService,
    ImageHandlerService,
    PluginRegistryService,
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditorComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="rte-container"
      [class.rte-dark]="mergedConfig.darkMode"
      [class.rte-readonly]="mergedConfig.readonly"
      [class.rte-focused]="isFocused"
    >
      @if (!mergedConfig.readonly) {
        <rte-toolbar
          #toolbarRef
          [toolbarGroups]="toolbarGroups"
          [customActions]="pluginActions"
          [editor]="commandService"
          [activeStates]="activeStates"
          [currentTextColor]="currentTextColor"
          [currentBgColor]="currentBgColor"
          (actionExecuted)="onToolbarAction($event)"
          (linkInsert)="onLinkInsert($event)"
          (linkRemove)="onLinkRemove()"
          (tableInsert)="onTableInsert($event)"
          (imageInsertFromUrl)="onImageInsertUrl($event)"
          (imageUploadFromFile)="onImageUploadFile($event)"
          (colorChange)="onColorChange($event)"
          (customActionExecuted)="onCustomAction($event)"
          (dropdownOpened)="onDropdownOpened()"
        ></rte-toolbar>
      }

      <div class="rte-editor-wrapper">
        <div
          #editorEl
          class="rte-editor-content"
          contenteditable="true"
          [attr.contenteditable]="mergedConfig.readonly ? 'false' : 'true'"
          [style.min-height]="mergedConfig.minHeight"
          [style.max-height]="mergedConfig.maxHeight"
          [attr.data-placeholder]="mergedConfig.placeholder"
          [attr.aria-label]="'Rich text editor'"
          [attr.aria-multiline]="'true'"
          role="textbox"
          tabindex="0"
          spellcheck="true"
        ></div>
      </div>
    </div>
  `,
  styleUrl: './editor.component.scss',
})
export class EditorComponent implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {
  @ViewChild('editorEl', { static: true }) editorEl!: ElementRef<HTMLDivElement>;
  @ViewChild('toolbarRef') toolbarRef!: ToolbarComponent;

  @Input() config: Partial<EditorConfig> = {};
  @Input() plugins: EditorPlugin[] = [];

  @Output() contentChange = new EventEmitter<EditorChangeEvent>();
  @Output() editorFocus = new EventEmitter<FocusEvent>();
  @Output() editorBlur = new EventEmitter<FocusEvent>();
  @Output() imageUpload = new EventEmitter<EditorImageUploadEvent>();
  @Output() imageResize = new EventEmitter<EditorImageResizeEvent>();

  mergedConfig: EditorConfig = { ...DEFAULT_EDITOR_CONFIG };
  toolbarGroups: ToolbarGroup[] = DEFAULT_TOOLBAR_GROUPS;
  pluginActions: ToolbarAction[] = [];
  activeStates: Record<string, boolean> = {};
  currentTextColor: string | null = null;
  currentBgColor: string | null = null;
  isFocused = false;

  private destroy$ = new Subject<void>();
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private isDisabled = false;
  private lastEmittedValue = '';

  constructor(
    public commandService: EditorCommandService,
    private imageHandler: ImageHandlerService,
    private pluginRegistry: PluginRegistryService,
    private cdr: ChangeDetectorRef,
  ) {}

  // ─── Lifecycle ───

  ngOnInit(): void {
    this.mergeConfig();

    const el = this.editorEl.nativeElement;
    this.commandService.setEditorElement(el);

    // Init image handler
    this.imageHandler.init(
      this.commandService,
      el,
      this.mergedConfig.image || {},
    );

    // Forward image events
    this.imageHandler.imageUpload$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => this.imageUpload.emit(event));

    this.imageHandler.imageResize$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => this.imageResize.emit(event));

    // Register plugins
    this.initPlugins();

    // Setup events
    this.setupEditorEvents(el);

    // Initial history entry
    this.commandService.pushToHistory(el.innerHTML);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] && !changes['config'].firstChange) {
      this.mergeConfig();
      this.cdr.markForCheck();
    }
    if (changes['plugins'] && !changes['plugins'].firstChange) {
      this.initPlugins();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.imageHandler.destroy();
    this.pluginRegistry.destroyAll();
  }

  // ─── ControlValueAccessor ───

  writeValue(value: string): void {
    if (value !== undefined && value !== null) {
      const html = this.mergedConfig.sanitize ? sanitizeHtml(value) : value;
      this.commandService.setContent(html);
      this.lastEmittedValue = html;
    } else {
      this.commandService.setContent('');
      this.lastEmittedValue = '';
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.mergedConfig = { ...this.mergedConfig, readonly: isDisabled };
    if (this.editorEl) {
      this.editorEl.nativeElement.contentEditable = String(!isDisabled);
    }
    this.cdr.markForCheck();
  }

  // ─── Toolbar Actions ───

  onToolbarAction(event: { type: ToolbarActionType; value?: string }): void {
    this.commandService.focus();

    switch (event.type) {
      case 'bold':
        this.commandService.toggleBold();
        break;
      case 'italic':
        this.commandService.toggleItalic();
        break;
      case 'underline':
        this.commandService.toggleUnderline();
        break;
      case 'strike':
        this.commandService.toggleStrikethrough();
        break;
      case 'heading':
        if (event.value) this.commandService.setHeading(event.value);
        break;
      case 'paragraph':
        this.commandService.setHeading('p');
        break;
      case 'align-left':
        this.commandService.setAlignment('left');
        break;
      case 'align-center':
        this.commandService.setAlignment('center');
        break;
      case 'align-right':
        this.commandService.setAlignment('right');
        break;
      case 'align-justify':
        this.commandService.setAlignment('justify');
        break;
      case 'ordered-list':
        this.commandService.toggleOrderedList();
        break;
      case 'unordered-list':
        this.commandService.toggleUnorderedList();
        break;
      case 'indent':
        this.commandService.indent();
        break;
      case 'outdent':
        this.commandService.outdent();
        break;
      case 'blockquote':
        this.commandService.toggleBlockquote();
        break;
      case 'code-inline':
        this.commandService.toggleInlineCode();
        break;
      case 'code-block':
        this.commandService.insertCodeBlock();
        break;
      case 'undo':
        this.handleUndo();
        break;
      case 'redo':
        this.handleRedo();
        break;
      case 'font-family':
        if (event.value) this.commandService.setFontFamily(event.value);
        break;
      case 'font-size':
        if (event.value) this.commandService.setFontSize(event.value);
        break;
      case 'clear-format':
        this.commandService.clearFormatting();
        break;
    }

    this.emitChange('user');
    this.updateActiveStates();
  }

  onLinkInsert(linkData: LinkData): void {
    this.commandService.focus();
    this.commandService.insertLink(linkData.url, linkData.text, linkData.target);
    this.emitChange('user');
  }

  onLinkRemove(): void {
    this.commandService.focus();
    this.commandService.removeLink();
    this.emitChange('user');
  }

  onTableInsert(config: TableConfig): void {
    this.commandService.focus();
    this.insertTable(config);
    this.emitChange('user');
  }

  onImageInsertUrl(data: { url: string; alt: string }): void {
    this.commandService.focus();
    this.imageHandler.insertImageFromUrl(data.url, data.alt);
    this.emitChange('user');
  }

  onImageUploadFile(file: File): void {
    this.commandService.focus();
    this.imageHandler.handleFileUpload(file);
  }

  onColorChange(event: { type: 'text' | 'bg'; color: string | null }): void {
    this.commandService.focus();
    if (event.type === 'text') {
      if (event.color) {
        this.commandService.setTextColor(event.color);
        this.currentTextColor = event.color;
      } else {
        this.commandService.execCommand('removeFormat');
        this.currentTextColor = null;
      }
    } else {
      if (event.color) {
        this.commandService.setBackgroundColor(event.color);
        this.currentBgColor = event.color;
      } else {
        this.commandService.execCommand('removeFormat');
        this.currentBgColor = null;
      }
    }
    this.emitChange('user');
  }

  onCustomAction(action: ToolbarAction): void {
    if (action.execute) {
      action.execute(this.commandService);
      this.emitChange('user');
    }
  }

  onDropdownOpened(): void {
    this.commandService.saveSelection();
  }

  // ─── Keyboard Shortcuts ───

  private handleKeydown(event: KeyboardEvent): void {
    const isCtrl = event.ctrlKey || event.metaKey;

    if (isCtrl) {
      switch (event.key.toLowerCase()) {
        case 'b':
          event.preventDefault();
          this.commandService.toggleBold();
          this.updateActiveStates();
          break;
        case 'i':
          event.preventDefault();
          this.commandService.toggleItalic();
          this.updateActiveStates();
          break;
        case 'u':
          event.preventDefault();
          this.commandService.toggleUnderline();
          this.updateActiveStates();
          break;
        case 'k':
          event.preventDefault();
          this.toolbarRef?.toggleDropdown('link');
          break;
        case 'z':
          if (event.shiftKey) {
            event.preventDefault();
            this.handleRedo();
          } else {
            event.preventDefault();
            this.handleUndo();
          }
          break;
        case 'y':
          event.preventDefault();
          this.handleRedo();
          break;
      }
    }

    // Tab for indentation inside lists
    if (event.key === 'Tab') {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const container = sel.getRangeAt(0).commonAncestorContainer;
        if (this.isInsideList(container)) {
          event.preventDefault();
          if (event.shiftKey) {
            this.commandService.outdent();
          } else {
            this.commandService.indent();
          }
        }
      }
    }
  }

  // ─── Undo / Redo ───

  private handleUndo(): void {
    const html = this.commandService.undo();
    if (html !== null) {
      this.commandService.setContent(html);
      this.emitChange('user');
    }
  }

  private handleRedo(): void {
    const html = this.commandService.redo();
    if (html !== null) {
      this.commandService.setContent(html);
      this.emitChange('user');
    }
  }

  // ─── Table ───

  private insertTable(config: TableConfig): void {
    let html = '<table class="rte-table">';

    if (config.headerRow) {
      html += '<thead><tr>';
      for (let c = 0; c < config.cols; c++) {
        html += '<th contenteditable="true"><br></th>';
      }
      html += '</tr></thead>';
    }

    html += '<tbody>';
    const bodyRows = config.headerRow ? config.rows - 1 : config.rows;
    for (let r = 0; r < bodyRows; r++) {
      html += '<tr>';
      for (let c = 0; c < config.cols; c++) {
        html += '<td contenteditable="true"><br></td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table><p><br></p>';

    this.commandService.insertHtml(html);
  }

  // ─── Active State Detection ───

  updateActiveStates(): void {
    this.activeStates = {
      bold: this.commandService.queryCommandState('bold'),
      italic: this.commandService.queryCommandState('italic'),
      underline: this.commandService.queryCommandState('underline'),
      strike: this.commandService.queryCommandState('strikeThrough'),
      'ordered-list': this.commandService.queryCommandState('insertOrderedList'),
      'unordered-list': this.commandService.queryCommandState('insertUnorderedList'),
      'align-left': this.commandService.queryCommandState('justifyLeft'),
      'align-center': this.commandService.queryCommandState('justifyCenter'),
      'align-right': this.commandService.queryCommandState('justifyRight'),
      'align-justify': this.commandService.queryCommandState('justifyFull'),
    };

    // Detect current text/bg colors
    const textColor = this.commandService.queryCommandValue('foreColor');
    if (textColor) this.currentTextColor = textColor;

    const bgColor = this.commandService.queryCommandValue('hiliteColor');
    if (bgColor) this.currentBgColor = bgColor;

    this.cdr.markForCheck();
  }

  // ─── Event Setup ───

  private setupEditorEvents(el: HTMLElement): void {
    // Input / changes (debounced)
    fromEvent(el, 'input')
      .pipe(
        debounceTime(this.mergedConfig.debounceMs || 300),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.commandService.pushToHistory(el.innerHTML);
        this.emitChange('user');
      });

    // Selection change for active state updates
    fromEvent(document, 'selectionchange')
      .pipe(
        debounceTime(50),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        if (this.isFocused) {
          this.commandService.saveSelection();
          this.updateActiveStates();
        }
      });

    // Focus / Blur
    fromEvent<FocusEvent>(el, 'focus')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.isFocused = true;
        this.editorFocus.emit(event);
        this.cdr.markForCheck();
      });

    fromEvent<FocusEvent>(el, 'blur')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.isFocused = false;
        this.onTouched();
        this.editorBlur.emit(event);
        this.cdr.markForCheck();
      });

    // Keyboard
    fromEvent<KeyboardEvent>(el, 'keydown')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => this.handleKeydown(event));

    // Paste (images)
    fromEvent<ClipboardEvent>(el, 'paste')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.imageHandler.handlePaste(event);
      });

    // Drag & drop (images)
    fromEvent<DragEvent>(el, 'drop')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => this.imageHandler.handleDrop(event));

    fromEvent<DragEvent>(el, 'dragover')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => this.imageHandler.handleDragOver(event));

    // Ensure we start with a paragraph
    if (!el.innerHTML || el.innerHTML === '<br>') {
      el.innerHTML = '<p><br></p>';
    }
  }

  // ─── Emit Content Change ───

  private emitChange(source: 'user' | 'api' | 'silent'): void {
    let html = this.commandService.getContent();

    if (this.mergedConfig.sanitize) {
      html = sanitizeHtml(html);
    }

    if (html !== this.lastEmittedValue) {
      this.lastEmittedValue = html;
      this.onChange(html);
      this.contentChange.emit({
        html,
        text: this.commandService.getTextContent(),
        source,
      });
    }
  }

  // ─── Plugins ───

  private initPlugins(): void {
    this.pluginRegistry.destroyAll();

    // Register config plugins
    if (this.mergedConfig.plugins) {
      for (const plugin of this.mergedConfig.plugins) {
        this.pluginRegistry.registerPlugin(plugin);
      }
    }

    // Register input plugins
    for (const plugin of this.plugins) {
      this.pluginRegistry.registerPlugin(plugin);
    }

    this.pluginRegistry.initializeAll(this.commandService);
    this.pluginActions = this.pluginRegistry.getToolbarActions();
    this.cdr.markForCheck();
  }

  // ─── Config ───

  private mergeConfig(): void {
    this.mergedConfig = {
      ...DEFAULT_EDITOR_CONFIG,
      ...this.config,
      image: {
        ...DEFAULT_EDITOR_CONFIG.image,
        ...this.config.image,
      },
    };

    this.toolbarGroups = this.mergedConfig.toolbar || DEFAULT_TOOLBAR_GROUPS;
  }

  // ─── Helpers ───

  private isInsideList(node: Node | null): boolean {
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as Element).tagName;
        if (tag === 'UL' || tag === 'OL') return true;
      }
      if (node === this.editorEl?.nativeElement) return false;
      node = node.parentNode;
    }
    return false;
  }

  // ─── Public API ───

  /** Programmatically get editor HTML content */
  getHtml(): string {
    return this.commandService.getContent();
  }

  /** Programmatically set editor HTML content */
  setHtml(html: string): void {
    const sanitized = this.mergedConfig.sanitize ? sanitizeHtml(html) : html;
    this.commandService.setContent(sanitized);
    this.emitChange('api');
  }

  /** Get plain text content */
  getText(): string {
    return this.commandService.getTextContent();
  }

  /** Focus the editor */
  focusEditor(): void {
    this.commandService.focus();
  }

  /** Register a plugin dynamically */
  registerPlugin(plugin: EditorPlugin): void {
    this.pluginRegistry.registerPlugin(plugin);
    this.pluginActions = this.pluginRegistry.getToolbarActions();
    this.cdr.markForCheck();
  }

  /** Unregister a plugin */
  unregisterPlugin(name: string): void {
    this.pluginRegistry.unregisterPlugin(name);
    this.pluginActions = this.pluginRegistry.getToolbarActions();
    this.cdr.markForCheck();
  }
}
