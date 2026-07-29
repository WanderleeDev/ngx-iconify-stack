import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgxIconComponent } from 'ngx-icon-stack';
import { ThemeToggleService } from 'ngx-theme-stack';

@Component({
  selector: 'docs-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxIconComponent],
  templateUrl: './navbar.component.html',
  styles: `
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      border-bottom: 1px solid var(--color-border);
      background: color-mix(in oklch, var(--color-surface) 85%, transparent);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .navbar__inner {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 1.5rem;
      height: 3.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .navbar__logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.95rem;
    }

    .navbar__logo-icon {
      color: var(--color-accent);
    }

    .navbar__logo-text {
      background: var(--gradient-brand);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .navbar__actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .navbar__link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 0.45rem;
      color: var(--color-text-muted);
      text-decoration: none;
      transition: all 0.15s;
    }

    .navbar__link:hover {
      color: var(--color-accent);
      background: var(--color-surface-2);
    }

    .navbar__link--btn {
      border: none;
      background: transparent;
      cursor: pointer;
      font: inherit;
    }

    .navbar__toggle-skeleton {
      width: 2rem;
      height: 2rem;
      border-radius: 0.45rem;
      background: var(--color-surface-2);
    }
  `,
})
export class NavbarComponent {
  protected readonly theme = inject(ThemeToggleService);
}
