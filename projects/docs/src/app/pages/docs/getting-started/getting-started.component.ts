import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgxIconify } from 'ngx-iconify-stack';

@Component({
  selector: 'docs-getting-started',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxIconify],
  templateUrl: './getting-started.component.html',
})
export class GettingStartedComponent {
  readonly installCommand = 'ng add ngx-iconify-stack';
}
