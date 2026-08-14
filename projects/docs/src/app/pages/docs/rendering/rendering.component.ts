import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgxIconify } from 'ngx-iconify-stack';

@Component({
  selector: 'docs-rendering',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxIconify],
  templateUrl: './rendering.component.html',
})
export class RenderingComponent {}
