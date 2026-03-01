import { Component, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  EditorComponent,
  EditorConfig,
  EditorChangeEvent,
  EditorImageUploadEvent,
  EditorImageResizeEvent,
  EditorPlugin,
  EditorCommandExecutor,
  ToolbarAction,
} from '../rich-text-editor';
import { EmojiPlugin } from '../rich-text-editor/plugins/emoji-plugin';

/**
 * Custom plugin example: Timestamp inserter
 */
class TimestampPlugin implements EditorPlugin {
  name = 'timestamp';

  toolbarActions: ToolbarAction[] = [
    {
      type: 'custom',
      customId: 'insert-timestamp',
      label: 'Time',
      tooltip: 'Insert Current Timestamp',
      icon: '🕐',
      execute: (editor: EditorCommandExecutor) => {
        const now = new Date().toLocaleString();
        editor.insertHtml(`<span class="timestamp">[${now}]</span> `);
      },
    },
  ];

  init(_editor: EditorCommandExecutor): void {}
  destroy(): void {}
}

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, EditorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo-container" [class.demo-dark]="darkMode">
      <header class="demo-header">
        <h1>Rich Text Editor Demo</h1>
        <p>An advanced Angular Rich Text Editor with plugin architecture</p>
        <div class="demo-controls">
          <label class="demo-toggle">
            <input type="checkbox" [(ngModel)]="darkMode" (ngModelChange)="toggleDarkMode()">
            Dark Mode
          </label>
          <label class="demo-toggle">
            <input type="checkbox" [(ngModel)]="readonly" (ngModelChange)="toggleReadonly()">
            Read Only
          </label>
        </div>
      </header>

      <section class="demo-section">
        <h2>1. Basic Usage with Reactive Forms</h2>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="demo-form-group">
            <label for="title">Title</label>
            <input id="title" type="text" formControlName="title" class="demo-input">
          </div>

          <div class="demo-form-group">
            <label>Content</label>
            <rte-editor
              #editor
              formControlName="content"
              [config]="editorConfig"
              [plugins]="editorPlugins"
              (contentChange)="onContentChange($event)"
              (editorFocus)="onFocus()"
              (editorBlur)="onBlur()"
              (imageUpload)="onImageUpload($event)"
              (imageResize)="onImageResize($event)"
            ></rte-editor>
            @if (form.get('content')?.hasError('required') && form.get('content')?.touched) {
              <div class="demo-error">Content is required</div>
            }
          </div>

          <div class="demo-actions">
            <button type="submit" class="demo-btn demo-btn-primary" [disabled]="!form.valid">
              Submit
            </button>
            <button type="button" class="demo-btn" (click)="setContent()">
              Set Sample Content
            </button>
            <button type="button" class="demo-btn" (click)="clearContent()">
              Clear
            </button>
          </div>
        </form>
      </section>

      <section class="demo-section">
        <h2>2. HTML Output Preview</h2>
        <div class="demo-output">
          <h3>Raw HTML</h3>
          <pre class="demo-pre">{{ form.get('content')?.value || '(empty)' }}</pre>
        </div>
        <div class="demo-output">
          <h3>Rendered Preview</h3>
          <div class="demo-rendered" [innerHTML]="form.get('content')?.value"></div>
        </div>
      </section>

      <section class="demo-section">
        <h2>3. Event Log</h2>
        <div class="demo-log">
          @for (log of eventLogs; track log) {
            <div class="demo-log-entry">{{ log }}</div>
          }
          @if (eventLogs.length === 0) {
            <div class="demo-log-empty">No events yet. Start editing above...</div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .demo-container {
      max-width: 960px;
      margin: 0 auto;
      padding: 32px 24px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #202124;
      transition: background 0.3s, color 0.3s;
    }
    .demo-dark {
      background: #1a1a1a;
      color: #e8eaed;
    }
    .demo-header {
      text-align: center;
      margin-bottom: 40px;
    }
    .demo-header h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .demo-header p {
      color: #5f6368;
      font-size: 16px;
    }
    .demo-dark .demo-header p {
      color: #9aa0a6;
    }
    .demo-controls {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-top: 16px;
    }
    .demo-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
    }
    .demo-section {
      margin-bottom: 40px;
    }
    .demo-section h2 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #ddd;
    }
    .demo-dark .demo-section h2 {
      border-color: #444;
    }
    .demo-form-group {
      margin-bottom: 16px;
    }
    .demo-form-group label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 6px;
    }
    .demo-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
    }
    .demo-dark .demo-input {
      background: #2d2d2d;
      border-color: #444;
      color: #e8eaed;
    }
    .demo-input:focus {
      border-color: #1a73e8;
      box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.2);
    }
    .demo-error {
      color: #d93025;
      font-size: 12px;
      margin-top: 4px;
    }
    .demo-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    .demo-btn {
      padding: 8px 18px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      background: #fff;
      color: #333;
      font-weight: 500;
    }
    .demo-dark .demo-btn {
      background: #2d2d2d;
      border-color: #444;
      color: #e8eaed;
    }
    .demo-btn:hover {
      background: #f1f3f4;
    }
    .demo-dark .demo-btn:hover {
      background: #3c3c3c;
    }
    .demo-btn-primary {
      background: #1a73e8;
      color: #fff;
      border-color: #1a73e8;
    }
    .demo-btn-primary:hover {
      background: #1557b0;
    }
    .demo-btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .demo-output {
      margin-bottom: 16px;
    }
    .demo-output h3 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .demo-pre {
      background: #f6f8fa;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 12px;
      font-size: 12px;
      font-family: monospace;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 200px;
      overflow-y: auto;
    }
    .demo-dark .demo-pre {
      background: #2d2d2d;
      border-color: #444;
    }
    .demo-rendered {
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 16px;
      min-height: 50px;
    }
    .demo-dark .demo-rendered {
      border-color: #444;
    }
    .demo-log {
      background: #f6f8fa;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 8px 12px;
      max-height: 200px;
      overflow-y: auto;
      font-size: 12px;
      font-family: monospace;
    }
    .demo-dark .demo-log {
      background: #2d2d2d;
      border-color: #444;
    }
    .demo-log-entry {
      padding: 4px 0;
      border-bottom: 1px solid #eee;
    }
    .demo-dark .demo-log-entry {
      border-color: #3c3c3c;
    }
    .demo-log-entry:last-child {
      border-bottom: none;
    }
    .demo-log-empty {
      color: #999;
      font-style: italic;
    }
  `],
})
export class DemoComponent {
  @ViewChild('editor') editor!: EditorComponent;

  darkMode = false;
  readonly = false;

  editorConfig: EditorConfig = {
    placeholder: 'Write something amazing...',
    minHeight: '250px',
    maxHeight: '500px',
    darkMode: false,
    debounceMs: 300,
    image: {
      maxWidth: 600,
      enableResize: true,
      enableCaption: true,
      enableLazyLoading: true,
      maintainAspectRatio: true,
      // Example upload function (returns a fake URL)
      uploadFn: async (file: File) => {
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        return URL.createObjectURL(file);
      },
    },
  };

  editorPlugins: EditorPlugin[] = [
    new EmojiPlugin(),
    new TimestampPlugin(),
  ];

  form = new FormGroup({
    title: new FormControl('', [Validators.required]),
    content: new FormControl('', [Validators.required]),
  });

  eventLogs: string[] = [];

  toggleDarkMode(): void {
    this.editorConfig = { ...this.editorConfig, darkMode: this.darkMode };
  }

  toggleReadonly(): void {
    this.editorConfig = { ...this.editorConfig, readonly: this.readonly };
  }

  onContentChange(event: EditorChangeEvent): void {
    this.addLog(`Content changed (source: ${event.source}, length: ${event.html.length})`);
  }

  onFocus(): void {
    this.addLog('Editor focused');
  }

  onBlur(): void {
    this.addLog('Editor blurred');
  }

  onImageUpload(event: EditorImageUploadEvent): void {
    this.addLog(`Image upload: ${event.file.name} (progress: ${event.progress}%)`);
  }

  onImageResize(event: EditorImageResizeEvent): void {
    this.addLog(`Image resized: ${event.previousWidth}x${event.previousHeight} -> ${event.width}x${event.height}`);
  }

  setContent(): void {
    this.form.patchValue({
      content: `
        <h2>Welcome to the Rich Text Editor</h2>
        <p>This editor supports <strong>bold</strong>, <em>italic</em>, <u>underline</u>,
        and <s>strikethrough</s> text.</p>
        <blockquote>This is a blockquote with some insightful content.</blockquote>
        <p>Here's some <code>inline code</code> and a code block:</p>
        <pre><code>function greet(name: string): string {
  return \`Hello, \${name}!\`;
}</code></pre>
        <h3>Features</h3>
        <ul>
          <li>Rich text formatting</li>
          <li>Image handling (upload, resize, align)</li>
          <li>Table support</li>
          <li>Plugin architecture</li>
        </ul>
        <p>Try out all the toolbar buttons above!</p>
      `,
    });
  }

  clearContent(): void {
    this.form.patchValue({ content: '' });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.addLog(`Form submitted: ${JSON.stringify(this.form.value).substring(0, 100)}...`);
    }
  }

  private addLog(message: string): void {
    const time = new Date().toLocaleTimeString();
    this.eventLogs.unshift(`[${time}] ${message}`);
    if (this.eventLogs.length > 50) {
      this.eventLogs.pop();
    }
  }
}
