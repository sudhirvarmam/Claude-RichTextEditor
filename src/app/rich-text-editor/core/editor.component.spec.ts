import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { EditorComponent } from './editor.component';

describe('EditorComponent', () => {
  let component: EditorComponent;
  let fixture: ComponentFixture<EditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorComponent, ReactiveFormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a contenteditable element', () => {
    const el = fixture.nativeElement.querySelector('.rte-editor-content');
    expect(el).toBeTruthy();
    expect(el.getAttribute('contenteditable')).toBe('true');
  });

  it('should display placeholder text', () => {
    const el = fixture.nativeElement.querySelector('.rte-editor-content');
    expect(el.getAttribute('data-placeholder')).toBe('Start typing...');
  });

  it('should render toolbar when not readonly', () => {
    const toolbar = fixture.nativeElement.querySelector('rte-toolbar');
    expect(toolbar).toBeTruthy();
  });

  it('should hide toolbar when readonly', () => {
    component.config = { readonly: true };
    component.ngOnChanges({
      config: {
        currentValue: component.config,
        previousValue: {},
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    fixture.detectChanges();
    const toolbar = fixture.nativeElement.querySelector('rte-toolbar');
    expect(toolbar).toBeFalsy();
  });

  it('should implement ControlValueAccessor writeValue', () => {
    const testHtml = '<p>Hello World</p>';
    component.writeValue(testHtml);
    expect(component.getHtml()).toContain('Hello World');
  });

  it('should implement ControlValueAccessor writeValue with null', () => {
    component.writeValue(null as unknown as string);
    expect(component.getHtml()).toBe('');
  });

  it('should implement registerOnChange', () => {
    const fn = jasmine.createSpy('onChange');
    component.registerOnChange(fn);
    // Verify no errors
    expect(component).toBeTruthy();
  });

  it('should implement registerOnTouched', () => {
    const fn = jasmine.createSpy('onTouched');
    component.registerOnTouched(fn);
    expect(component).toBeTruthy();
  });

  it('should set disabled state', () => {
    component.setDisabledState(true);
    fixture.detectChanges();
    expect(component.mergedConfig.readonly).toBe(true);
  });

  it('should apply dark mode class', () => {
    component.config = { darkMode: true };
    component.ngOnChanges({
      config: {
        currentValue: component.config,
        previousValue: {},
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('.rte-container');
    expect(container.classList.contains('rte-dark')).toBe(true);
  });

  it('should return text content via getText()', () => {
    component.writeValue('<p>Test content</p>');
    expect(component.getText()).toContain('Test content');
  });

  it('should set content via setHtml()', () => {
    component.setHtml('<p>New content</p>');
    expect(component.getHtml()).toContain('New content');
  });

  it('should merge config with defaults', () => {
    component.config = { placeholder: 'Custom placeholder' };
    component.ngOnChanges({
      config: {
        currentValue: component.config,
        previousValue: {},
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    expect(component.mergedConfig.placeholder).toBe('Custom placeholder');
    expect(component.mergedConfig.minHeight).toBe('200px'); // default
  });
});
