import { PluginRegistryService } from './plugin-registry.service';
import { EditorCommandExecutor, EditorPlugin } from '../models/editor.models';

describe('PluginRegistryService', () => {
  let service: PluginRegistryService;
  let mockEditor: jasmine.SpyObj<EditorCommandExecutor>;

  beforeEach(() => {
    service = new PluginRegistryService();
    mockEditor = jasmine.createSpyObj('EditorCommandExecutor', [
      'execCommand', 'queryCommandState', 'queryCommandValue',
      'insertHtml', 'getSelection', 'saveSelection', 'restoreSelection',
      'getContent', 'setContent', 'focus',
    ]);
  });

  function createMockPlugin(name: string): EditorPlugin {
    return {
      name,
      init: jasmine.createSpy('init'),
      destroy: jasmine.createSpy('destroy'),
      toolbarActions: [
        { type: 'custom', label: `${name} action`, customId: `${name}-action` },
      ],
    };
  }

  it('should register a plugin', () => {
    const plugin = createMockPlugin('test');
    service.registerPlugin(plugin);
    expect(service.getRegisteredPlugins()).toEqual(['test']);
  });

  it('should not register duplicate plugins', () => {
    const plugin = createMockPlugin('test');
    service.registerPlugin(plugin);
    service.registerPlugin(plugin);
    expect(service.getRegisteredPlugins()).toEqual(['test']);
  });

  it('should unregister a plugin and call destroy', () => {
    const plugin = createMockPlugin('test');
    service.registerPlugin(plugin);
    service.unregisterPlugin('test');
    expect(plugin.destroy).toHaveBeenCalled();
    expect(service.getRegisteredPlugins()).toEqual([]);
  });

  it('should initialize all plugins with editor', () => {
    const p1 = createMockPlugin('p1');
    const p2 = createMockPlugin('p2');
    service.registerPlugin(p1);
    service.registerPlugin(p2);

    service.initializeAll(mockEditor);
    expect(p1.init).toHaveBeenCalledWith(mockEditor);
    expect(p2.init).toHaveBeenCalledWith(mockEditor);
  });

  it('should destroy all plugins', () => {
    const p1 = createMockPlugin('p1');
    const p2 = createMockPlugin('p2');
    service.registerPlugin(p1);
    service.registerPlugin(p2);

    service.destroyAll();
    expect(p1.destroy).toHaveBeenCalled();
    expect(p2.destroy).toHaveBeenCalled();
    expect(service.getRegisteredPlugins()).toEqual([]);
  });

  it('should return toolbar actions from all plugins', () => {
    const p1 = createMockPlugin('p1');
    const p2 = createMockPlugin('p2');
    service.registerPlugin(p1);
    service.registerPlugin(p2);

    const actions = service.getToolbarActions();
    expect(actions.length).toBe(2);
  });

  it('should get a specific plugin by name', () => {
    const plugin = createMockPlugin('test');
    service.registerPlugin(plugin);
    expect(service.getPlugin('test')).toBe(plugin);
    expect(service.getPlugin('nonexistent')).toBeUndefined();
  });

  it('should init plugin immediately if editor already set', () => {
    service.setEditor(mockEditor);
    const plugin = createMockPlugin('test');
    service.registerPlugin(plugin);
    expect(plugin.init).toHaveBeenCalledWith(mockEditor);
  });
});
