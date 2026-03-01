/**
 * Core editor models and interfaces for the Rich Text Editor.
 * Defines the structured document model, toolbar actions, and configuration.
 */

// ─── Document Model (ProseMirror/TipTap-inspired) ───

export type NodeType =
  | 'doc'
  | 'paragraph'
  | 'heading'
  | 'blockquote'
  | 'code_block'
  | 'ordered_list'
  | 'bullet_list'
  | 'list_item'
  | 'table'
  | 'table_row'
  | 'table_cell'
  | 'table_header'
  | 'image'
  | 'hard_break'
  | 'horizontal_rule'
  | 'text';

export type MarkType =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'code'
  | 'link'
  | 'text_color'
  | 'background_color'
  | 'font_family'
  | 'font_size';

export interface Mark {
  type: MarkType;
  attrs?: Record<string, unknown>;
}

export interface EditorNode {
  type: NodeType;
  attrs?: Record<string, unknown>;
  content?: EditorNode[];
  marks?: Mark[];
  text?: string;
}

// ─── Toolbar ───

export type ToolbarActionType =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'heading'
  | 'paragraph'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'align-justify'
  | 'ordered-list'
  | 'unordered-list'
  | 'indent'
  | 'outdent'
  | 'blockquote'
  | 'code-inline'
  | 'code-block'
  | 'link'
  | 'table'
  | 'image'
  | 'undo'
  | 'redo'
  | 'font-family'
  | 'font-size'
  | 'text-color'
  | 'bg-color'
  | 'clear-format'
  | 'separator'
  | 'custom';

export interface ToolbarAction {
  type: ToolbarActionType;
  icon?: string;
  label: string;
  tooltip?: string;
  shortcut?: string;
  dropdown?: DropdownOption[];
  isActive?: boolean;
  disabled?: boolean;
  /** For custom actions */
  execute?: (editor: EditorCommandExecutor) => void;
  /** Custom component ID for plugin buttons */
  customId?: string;
}

export interface DropdownOption {
  label: string;
  value: string | number;
  icon?: string;
  style?: Record<string, string>;
}

export interface ToolbarGroup {
  id: string;
  actions: ToolbarAction[];
}

// ─── Image ───

export type ImageAlignment = 'left' | 'center' | 'right';

export interface ImageConfig {
  maxWidth?: number;
  maxFileSize?: number; // bytes
  allowedTypes?: string[];
  enableResize?: boolean;
  enableCaption?: boolean;
  enableLazyLoading?: boolean;
  maintainAspectRatio?: boolean;
  uploadFn?: (file: File) => Promise<string>;
}

export interface ImageState {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  alignment?: ImageAlignment;
  caption?: string;
  naturalWidth?: number;
  naturalHeight?: number;
}

// ─── Table ───

export interface TableConfig {
  rows: number;
  cols: number;
  headerRow?: boolean;
  width?: string;
}

// ─── Editor Configuration ───

export interface EditorConfig {
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  toolbar?: ToolbarGroup[];
  image?: ImageConfig;
  darkMode?: boolean;
  readonly?: boolean;
  sanitize?: boolean;
  debounceMs?: number;
  plugins?: EditorPlugin[];
  customToolbarActions?: ToolbarAction[];
}

export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  placeholder: 'Start typing...',
  minHeight: '200px',
  maxHeight: '600px',
  darkMode: false,
  readonly: false,
  sanitize: true,
  debounceMs: 300,
  image: {
    maxWidth: 800,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
    enableResize: true,
    enableCaption: true,
    enableLazyLoading: true,
    maintainAspectRatio: true,
  },
};

// ─── Editor Events ───

export interface EditorChangeEvent {
  html: string;
  text: string;
  source: 'user' | 'api' | 'silent';
}

export interface EditorImageUploadEvent {
  file: File;
  url?: string;
  progress?: number;
}

export interface EditorImageResizeEvent {
  src: string;
  width: number;
  height: number;
  previousWidth: number;
  previousHeight: number;
}

// ─── Plugin System ───

export interface EditorPlugin {
  name: string;
  init(editor: EditorCommandExecutor): void;
  destroy?(): void;
  toolbarActions?: ToolbarAction[];
}

// ─── Command Executor Interface ───

export interface EditorCommandExecutor {
  execCommand(command: string, value?: string): void;
  queryCommandState(command: string): boolean;
  queryCommandValue(command: string): string;
  insertHtml(html: string): void;
  getSelection(): Selection | null;
  saveSelection(): void;
  restoreSelection(): void;
  getContent(): string;
  setContent(html: string): void;
  focus(): void;
}

// ─── Undo/Redo ───

export interface HistoryEntry {
  html: string;
  timestamp: number;
  cursorPosition?: { node: Node; offset: number } | null;
}

// ─── Link ───

export interface LinkData {
  url: string;
  text?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  title?: string;
}

// ─── Font Options ───

export const FONT_FAMILIES: DropdownOption[] = [
  { label: 'Default', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif', style: { 'font-family': 'Arial, sans-serif' } },
  { label: 'Georgia', value: 'Georgia, serif', style: { 'font-family': 'Georgia, serif' } },
  { label: 'Times New Roman', value: '"Times New Roman", serif', style: { 'font-family': '"Times New Roman", serif' } },
  { label: 'Courier New', value: '"Courier New", monospace', style: { 'font-family': '"Courier New", monospace' } },
  { label: 'Verdana', value: 'Verdana, sans-serif', style: { 'font-family': 'Verdana, sans-serif' } },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif', style: { 'font-family': '"Trebuchet MS", sans-serif' } },
  { label: 'Impact', value: 'Impact, sans-serif', style: { 'font-family': 'Impact, sans-serif' } },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive', style: { 'font-family': '"Comic Sans MS", cursive' } },
];

export const FONT_SIZES: DropdownOption[] = [
  { label: '8px', value: '1' },
  { label: '10px', value: '2' },
  { label: '12px', value: '3' },
  { label: '14px', value: '4' },
  { label: '18px', value: '5' },
  { label: '24px', value: '6' },
  { label: '36px', value: '7' },
];

export const HEADING_OPTIONS: DropdownOption[] = [
  { label: 'Paragraph', value: 'p' },
  { label: 'Heading 1', value: 'h1', style: { 'font-size': '2em', 'font-weight': 'bold' } },
  { label: 'Heading 2', value: 'h2', style: { 'font-size': '1.5em', 'font-weight': 'bold' } },
  { label: 'Heading 3', value: 'h3', style: { 'font-size': '1.17em', 'font-weight': 'bold' } },
  { label: 'Heading 4', value: 'h4', style: { 'font-size': '1em', 'font-weight': 'bold' } },
  { label: 'Heading 5', value: 'h5', style: { 'font-size': '0.83em', 'font-weight': 'bold' } },
  { label: 'Heading 6', value: 'h6', style: { 'font-size': '0.67em', 'font-weight': 'bold' } },
];
