import { Component } from '@angular/core';
import { DemoComponent } from './demo/demo.component';

@Component({
  selector: 'rte-root',
  standalone: true,
  imports: [DemoComponent],
  template: '<app-demo></app-demo>',
})
export class AppComponent {}
