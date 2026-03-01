import { Injectable } from '@angular/core';
import { EditorCommandExecutor, EditorPlugin, ToolbarAction } from '../models/editor.models';

/**
 * Plugin Registry Service.
 * Manages registration, initialization, and destruction of editor plugins.
 * Plugins can extend the toolbar with custom actions and hook into editor events.
 */
@Injectable()
export class PluginRegistryService {
  private plugins = new Map<string, EditorPlugin>();
  private editor: EditorCommandExecutor | null = null;

  setEditor(editor: EditorCommandExecutor): void {
    this.editor = editor;
  }

  registerPlugin(plugin: EditorPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin "${plugin.name}" is already registered. Skipping.`);
      return;
    }
    this.plugins.set(plugin.name, plugin);
    if (this.editor) {
      plugin.init(this.editor);
    }
  }

  unregisterPlugin(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.destroy?.();
      this.plugins.delete(name);
    }
  }

  initializeAll(editor: EditorCommandExecutor): void {
    this.editor = editor;
    for (const plugin of this.plugins.values()) {
      plugin.init(editor);
    }
  }

  destroyAll(): void {
    for (const plugin of this.plugins.values()) {
      plugin.destroy?.();
    }
    this.plugins.clear();
    this.editor = null;
  }

  getToolbarActions(): ToolbarAction[] {
    const actions: ToolbarAction[] = [];
    for (const plugin of this.plugins.values()) {
      if (plugin.toolbarActions) {
        actions.push(...plugin.toolbarActions);
      }
    }
    return actions;
  }

  getPlugin(name: string): EditorPlugin | undefined {
    return this.plugins.get(name);
  }

  getRegisteredPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }
}
