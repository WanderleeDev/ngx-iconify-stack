import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgxIconComponent } from 'ngx-icon-stack';
import { ThemeToggleService } from 'ngx-theme-stack';

@Component({
  selector: 'docs-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxIconComponent],
  templateUrl: './navbar.component.html',
  styles: ``,
})
export class NavbarComponent {
  protected readonly theme = inject(ThemeToggleService);
}
