import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgxIconify } from 'ngx-iconify-stack';
import { ThemeToggleService } from 'ngx-theme-stack';

@Component({
  selector: 'docs-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxIconify],
  templateUrl: './navbar.component.html',
  styles: ``,
})
export class NavbarComponent {
  protected readonly theme = inject(ThemeToggleService);
}
