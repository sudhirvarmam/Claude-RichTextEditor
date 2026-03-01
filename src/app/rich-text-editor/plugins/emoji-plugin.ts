import { EditorCommandExecutor, EditorPlugin, ToolbarAction } from '../models/editor.models';

/**
 * Example plugin: Emoji Picker
 * Demonstrates how to create a custom toolbar button via the plugin system.
 */
export class EmojiPlugin implements EditorPlugin {
  name = 'emoji';
  private editor: EditorCommandExecutor | null = null;

  private emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥', '✨', '💡', '⚡', '🚀'];

  toolbarActions: ToolbarAction[] = [
    {
      type: 'custom',
      customId: 'emoji-picker',
      label: 'Emoji',
      tooltip: 'Insert Emoji',
      icon: '😀',
      execute: (editor: EditorCommandExecutor) => {
        const emoji = this.emojis[Math.floor(Math.random() * this.emojis.length)];
        editor.insertHtml(emoji);
      },
    },
  ];

  init(editor: EditorCommandExecutor): void {
    this.editor = editor;
  }

  destroy(): void {
    this.editor = null;
  }
}
