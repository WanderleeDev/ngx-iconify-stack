import { Component } from '@angular/core';
import { NgxIconify } from 'ngx-iconify-stack';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [NgxIconify],
  template: `
    <ngx-iconify icon="mdi:home" [size]="24" />
    <ngx-iconify icon="lucide:arrow-right" color="#f59e0b" />
    <ngx-iconify icon="tabler:brand-github" inline />
  `,
})
export class ExampleComponent {}
