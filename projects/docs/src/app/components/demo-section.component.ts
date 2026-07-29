import { Component, signal, computed } from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { NgxIconComponent } from 'ngx-icon-stack';

interface DemoIcon {
  icon: string;
  label: string;
  set: string;
}

@Component({
  selector: 'docs-demo',
  imports: [NgxIconComponent, FormsModule],
  template: `
    <section class="demo" aria-labelledby="demo-title">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="demo__search-wrap">
          <ngx-icon icon="mdi:magnify" [size]="18" class="demo__search-icon" aria-hidden="true" />
          <input
            id="demo-search-input"
            type="text"
            class="demo__search"
            placeholder="Search icons... (e.g. home, heart, arrow)"
            [(ngModel)]="query"
            aria-label="Search icons"
          />
        </div>

        @if (!query()) {
          <p>Type something to search for icons</p>
        } @else {
          <div>
            <h3 class="text-xl font-bold">Preview: {{ query() }}</h3>
            <div class="hero__icon-chip" [title]="query()">
              <ngx-icon [icon]="query()" class="scale-150" [size]="40" aria-hidden="true" />
            </div>
          </div>
        }
      </div>
      <!-- <div class="section-header">
        <h2 id="demo-title" class="section-title">Live Demo</h2>
        <p class="section-desc">
          Search and preview icons from any Iconify set. Click an icon to copy its identifier.
        </p>
      </div>

      <div class="demo__controls">
        <div class="demo__search-wrap">
          <ngx-icon icon="mdi:magnify" [size]="18" class="demo__search-icon" aria-hidden="true" />
          <input
            id="demo-search-input"
            type="text"
            class="demo__search"
            placeholder="Search icons... (e.g. home, heart, arrow)"
            [value]="query()"
            (input)="onSearch($event)"
            aria-label="Search icons"
          />
        </div>

        <div class="demo__size-control" role="group" aria-label="Icon size">
          <span class="demo__size-label">Size: {{ selectedSize() }}px</span>
          <input
            id="demo-size-slider"
            type="range"
            min="16"
            max="64"
            step="4"
            [value]="selectedSize()"
            (input)="onSize($event)"
            class="demo__slider"
            aria-label="Icon size slider"
          />
        </div>
      </div>

      <div class="demo__grid" role="list" aria-label="Icon grid">
        @for (item of filteredIcons(); track item.icon) {
          <button
            class="demo__card"
            [id]="'icon-' + item.icon.replace(':', '-')"
            (click)="copyIcon(item.icon)"
            [title]="'Copy: ' + item.icon"
            role="listitem"
            [attr.aria-label]="'Copy icon identifier ' + item.icon"
          >
            <ngx-icon [icon]="item.icon" [size]="selectedSize()" />
            <span class="demo__card-label">{{ item.label }}</span>
            <span class="demo__card-set">{{ item.set }}</span>
            @if (copiedIcon() === item.icon) {
              <span class="demo__copied" aria-live="polite">Copied!</span>
            }
          </button>
        } @empty {
          <div class="demo__empty" role="status">
            <ngx-icon icon="mdi:magnify-remove-outline" [size]="40" />
            <p>No icons found for "{{ query() }}"</p>
          </div>
        }
      </div> -->
    </section>
  `,
  styles: `
    .demo {
      padding: 4rem 1.5rem;
      max-width: 900px;
      margin: 0 auto;
    }

    .section-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .section-title {
      font-size: clamp(1.8rem, 4vw, 2.6rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      margin: 0 0 0.75rem;
      background: var(--gradient-brand);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .section-desc {
      color: var(--color-text-muted);
      font-size: 1rem;
      margin: 0;
    }

    .demo__controls {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.75rem;
      align-items: center;
    }

    .demo__search-wrap {
      position: relative;
      flex: 1;
      min-width: 200px;
    }

    .demo__search-icon {
      position: absolute;
      left: 0.9rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-text-muted);
      pointer-events: none;
    }

    .demo__search {
      width: 100%;
      padding: 0.65rem 0.9rem 0.65rem 2.6rem;
      border-radius: 0.6rem;
      border: 1.5px solid var(--color-border);
      background: var(--color-surface-2);
      color: var(--color-text);
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .demo__search:focus {
      border-color: var(--color-accent);
    }

    .demo__size-control {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      white-space: nowrap;
    }

    .demo__size-label {
      font-size: 0.85rem;
      color: var(--color-text-muted);
      min-width: 6rem;
    }

    .demo__slider {
      accent-color: var(--color-accent);
      width: 100px;
      cursor: pointer;
    }

    .demo__grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 0.75rem;
    }

    .demo__card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 1rem 0.5rem 0.75rem;
      border-radius: 0.75rem;
      border: 1.5px solid var(--color-border);
      background: var(--color-surface-2);
      color: var(--color-text);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
      font: inherit;
    }

    .demo__card:hover {
      border-color: var(--color-accent);
      background: color-mix(in oklch, var(--color-accent) 8%, var(--color-surface-2));
      transform: translateY(-3px);
      box-shadow: 0 8px 24px color-mix(in oklch, var(--color-accent) 20%, transparent);
    }

    .demo__card-label {
      font-size: 0.72rem;
      font-weight: 600;
      text-align: center;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .demo__card-set {
      font-size: 0.65rem;
      color: var(--color-accent);
      font-weight: 500;
    }

    .demo__copied {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in oklch, var(--color-accent) 85%, transparent);
      color: #fff;
      font-size: 0.8rem;
      font-weight: 700;
      border-radius: inherit;
      animation: fadeInOut 1.2s ease forwards;
    }

    @keyframes fadeInOut {
      0% {
        opacity: 0;
      }
      20% {
        opacity: 1;
      }
      80% {
        opacity: 1;
      }
      100% {
        opacity: 0;
      }
    }

    .demo__empty {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      color: var(--color-text-muted);
      font-size: 0.9rem;
    }

    .hero__icon-chip {
      margin: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      width: fit-content;
      height: fit-content;
      padding: 1rem;
      border-radius: 0.75rem;
      background: var(--color-surface-2);
      border: 1px solid var(--color-border);
      color: var(--color-text);
      transition: all 0.2s ease;
    }

    .hero__icon-chip:hover {
      background: color-mix(in oklch, var(--color-accent) 12%, transparent);
      border-color: var(--color-accent);
      transform: translateY(-3px) scale(1.08);
      color: var(--color-accent);
    }
  `,
})
export class DemoSectionComponent {
  readonly query = signal('');
  readonly selectedSize = signal(32);
  readonly copiedIcon = signal<string | null>(null);

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  onSize(event: Event): void {
    this.selectedSize.set(Number((event.target as HTMLInputElement).value));
  }

  copyIcon(iconId: string): void {
    navigator.clipboard?.writeText(iconId).catch(() => {});
    this.copiedIcon.set(iconId);
    setTimeout(() => this.copiedIcon.set(null), 1300);
  }
}
