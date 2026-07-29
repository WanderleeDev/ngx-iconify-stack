import { Component } from '@angular/core';
import { NgxIconComponent } from 'ngx-icon-stack';

@Component({
  selector: 'docs-footer',
  imports: [NgxIconComponent],
  template: `
    <footer class="footer" role="contentinfo">
      <div class="footer__inner">
        <div class="footer__brand">
          <ngx-icon icon="tabler:package" [size]="22" class="footer__logo-icon" />
          <span class="footer__brand-name">ngx-icon-stack</span>
        </div>

        <p class="footer__tagline">
          Built with <ngx-icon icon="mdi:heart" [size]="14" class="footer__heart" aria-label="love" /> for the Angular community.
          Powered by <a href="https://iconify.design" target="_blank" rel="noopener noreferrer" class="footer__link">Iconify</a>.
        </p>

        <div class="footer__links" role="list">
          <a
            id="footer-npm"
            href="https://www.npmjs.com/package/ngx-icon-stack"
            target="_blank"
            rel="noopener noreferrer"
            class="footer__icon-link"
            aria-label="NPM package"
            role="listitem"
          >
            <ngx-icon icon="mdi:npm" [size]="20" />
          </a>
          <a
            id="footer-github"
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            class="footer__icon-link"
            aria-label="GitHub repository"
            role="listitem"
          >
            <ngx-icon icon="mdi:github" [size]="20" />
          </a>
          <a
            id="footer-iconify"
            href="https://iconify.design"
            target="_blank"
            rel="noopener noreferrer"
            class="footer__icon-link"
            aria-label="Iconify website"
            role="listitem"
          >
            <ngx-icon icon="simple-icons:iconify" [size]="18" />
          </a>
        </div>

        <p class="footer__copy">
          MIT License · ngx-icon-stack v0.0.1
        </p>
      </div>
    </footer>
  `,
  styles: `
    .footer {
      border-top: 1.5px solid var(--color-border);
      padding: 3rem 1.5rem;
      margin-top: 2rem;
    }

    .footer__inner {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      text-align: center;
    }

    .footer__brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 700;
      font-size: 1rem;
    }

    .footer__logo-icon {
      color: var(--color-accent);
    }

    .footer__brand-name {
      background: var(--gradient-brand);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .footer__tagline {
      color: var(--color-text-muted);
      font-size: 0.875rem;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    .footer__heart {
      color: oklch(60% 0.22 25);
    }

    .footer__link {
      color: var(--color-accent);
      text-decoration: none;
      font-weight: 600;
    }

    .footer__link:hover {
      text-decoration: underline;
    }

    .footer__links {
      display: flex;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }

    .footer__icon-link {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 0.5rem;
      border: 1.5px solid var(--color-border);
      background: var(--color-surface-2);
      color: var(--color-text-muted);
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .footer__icon-link:hover {
      color: var(--color-accent);
      border-color: var(--color-accent);
      background: color-mix(in oklch, var(--color-accent) 8%, var(--color-surface-2));
      transform: translateY(-2px);
    }

    .footer__copy {
      color: var(--color-text-muted);
      font-size: 0.78rem;
      margin: 0;
      opacity: 0.7;
    }
  `,
})
export class FooterSectionComponent {}
