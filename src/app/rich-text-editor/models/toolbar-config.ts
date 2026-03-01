/**
 * Default toolbar configuration with grouped actions.
 */
import {
  FONT_FAMILIES,
  FONT_SIZES,
  HEADING_OPTIONS,
  ToolbarGroup,
} from './editor.models';

export const DEFAULT_TOOLBAR_GROUPS: ToolbarGroup[] = [
  {
    id: 'history',
    actions: [
      { type: 'undo', label: 'Undo', tooltip: 'Undo (Ctrl+Z)', shortcut: 'Ctrl+Z', icon: 'undo' },
      { type: 'redo', label: 'Redo', tooltip: 'Redo (Ctrl+Y)', shortcut: 'Ctrl+Y', icon: 'redo' },
    ],
  },
  {
    id: 'font',
    actions: [
      {
        type: 'font-family',
        label: 'Font',
        tooltip: 'Font Family',
        icon: 'font-family',
        dropdown: FONT_FAMILIES,
      },
      {
        type: 'font-size',
        label: 'Size',
        tooltip: 'Font Size',
        icon: 'font-size',
        dropdown: FONT_SIZES,
      },
      {
        type: 'heading',
        label: 'Heading',
        tooltip: 'Heading',
        icon: 'heading',
        dropdown: HEADING_OPTIONS,
      },
    ],
  },
  {
    id: 'basic-formatting',
    actions: [
      { type: 'bold', label: 'Bold', tooltip: 'Bold (Ctrl+B)', shortcut: 'Ctrl+B', icon: 'bold' },
      { type: 'italic', label: 'Italic', tooltip: 'Italic (Ctrl+I)', shortcut: 'Ctrl+I', icon: 'italic' },
      { type: 'underline', label: 'Underline', tooltip: 'Underline (Ctrl+U)', shortcut: 'Ctrl+U', icon: 'underline' },
      { type: 'strike', label: 'Strikethrough', tooltip: 'Strikethrough', icon: 'strikethrough' },
    ],
  },
  {
    id: 'color',
    actions: [
      { type: 'text-color', label: 'Text Color', tooltip: 'Text Color', icon: 'text-color' },
      { type: 'bg-color', label: 'Background Color', tooltip: 'Background Color', icon: 'bg-color' },
    ],
  },
  {
    id: 'alignment',
    actions: [
      { type: 'align-left', label: 'Align Left', tooltip: 'Align Left', icon: 'align-left' },
      { type: 'align-center', label: 'Align Center', tooltip: 'Align Center', icon: 'align-center' },
      { type: 'align-right', label: 'Align Right', tooltip: 'Align Right', icon: 'align-right' },
      { type: 'align-justify', label: 'Justify', tooltip: 'Justify', icon: 'align-justify' },
    ],
  },
  {
    id: 'lists',
    actions: [
      { type: 'ordered-list', label: 'Ordered List', tooltip: 'Ordered List', icon: 'ordered-list' },
      { type: 'unordered-list', label: 'Unordered List', tooltip: 'Unordered List', icon: 'unordered-list' },
      { type: 'indent', label: 'Indent', tooltip: 'Increase Indent', icon: 'indent' },
      { type: 'outdent', label: 'Outdent', tooltip: 'Decrease Indent', icon: 'outdent' },
    ],
  },
  {
    id: 'blocks',
    actions: [
      { type: 'blockquote', label: 'Blockquote', tooltip: 'Blockquote', icon: 'blockquote' },
      { type: 'code-inline', label: 'Inline Code', tooltip: 'Inline Code', icon: 'code' },
      { type: 'code-block', label: 'Code Block', tooltip: 'Code Block', icon: 'code-block' },
    ],
  },
  {
    id: 'insert',
    actions: [
      { type: 'link', label: 'Link', tooltip: 'Insert Link (Ctrl+K)', shortcut: 'Ctrl+K', icon: 'link' },
      { type: 'image', label: 'Image', tooltip: 'Insert Image', icon: 'image' },
      { type: 'table', label: 'Table', tooltip: 'Insert Table', icon: 'table' },
    ],
  },
  {
    id: 'misc',
    actions: [
      { type: 'clear-format', label: 'Clear Formatting', tooltip: 'Clear Formatting', icon: 'clear-format' },
    ],
  },
];
