import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgxIconComponent } from 'ngx-icon-stack';
import { ThemeToggleService } from 'ngx-theme-stack';

@Component({
  selector: 'docs-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxIconComponent],
  template: `
    <header class="navbar" role="banner">
      <nav class="navbar__inner" aria-label="Main navigation">
        <a href="/" class="navbar__logo" aria-label="ngx-icon-stack home">
          <ngx-icon icon="tabler:package" [size]="20" class="navbar__logo-icon" />
          <span class="navbar__logo-text">ngx-icon-stack</span>
        </a>

        <div class="navbar__actions">
          <a
            id="nav-npm-link"
            href="https://www.npmjs.com/package/ngx-icon-stack"
            target="_blank"
            rel="noopener noreferrer"
            class="navbar__link"
            aria-label="NPM"
          >
            <ngx-icon icon="mdi:npm" [size]="18" />
          </a>
          <a
            id="nav-github-link"
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            class="navbar__link"
            aria-label="GitHub"
          >
            <ngx-icon icon="mdi:github" [size]="18" />
          </a>

          @if (theme.isHydrated()) {
            <button
              id="nav-theme-toggle"
              class="navbar__link navbar__link--btn"
              (click)="theme.toggle()"
              [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'"
              [title]="theme.isDark() ? 'Light mode' : 'Dark mode'"
            >
              <ngx-icon
                [icon]="theme.isDark() ? 'mdi:weather-sunny' : 'mdi:weather-night'"
                [size]="18"
              />
            </button>
          } @else {
            <div class="navbar__toggle-skeleton" aria-hidden="true"></div>
          }
        </div>
      </nav>
    </header>
  `,
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
