import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgxIconify } from 'ngx-iconify-stack';
import { ThemeToggleService } from 'ngx-theme-stack';

@Component({
  selector: 'docs-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxIconify, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styles: `
    .nav-link-active {
      color: var(--color-accent);
    }
  `,
})
export class NavbarComponent {
  protected readonly theme = inject(ThemeToggleService);
}
