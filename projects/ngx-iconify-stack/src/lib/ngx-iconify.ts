import { IconFlip, IconMode } from './types';
import { lookupIcon } from './icon-helpers';
import { NGX_ICONIFY_CONFIG } from './icon.config';
import {
  Component,
  input,
  signal,
  computed,
  inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA,
  afterNextRender,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Angular component wrapping Iconify with SSR-safe inline SVG fallback.
 *
 * **SSR / initial render**: if the icon is found in `offlineCollections`,
 * renders an inline `<svg>` directly in the HTML — no flicker, no wait for
 * the web component.
 *
 * **After hydration**: once `<iconify-icon>` is registered in the browser,
 * switches to the web component for dynamic updates (flip, rotate, CDN
 * fallback for icons not in the subset).
 *
 * @example
 * ```html
 * <ngx-icon icon="mdi:home" [size]="24" />
 * <ngx-icon icon="lucide:arrow-right" color="#ff0000" />
 * ```
 */
@Component({
  selector: 'ngx-icon',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (svgContent(); as safe) {
      <span
        [innerHTML]="safe"
        [style.width.px]="displayWidth()"
        [style.height.px]="displayHeight()"
        [style.verticalAlign]="inline() ? '-0.125em' : null"
        [style.fontSize.px]="size()"
      ></span>
    } @else {
      <iconify-icon
        [attr.icon]="icon()"
        [attr.width]="width()"
        [attr.height]="height()"
        [attr.rotate]="rotate()"
        [attr.flip]="flip()"
        [attr.inline]="inline() ? '' : null"
        [attr.mode]="mode()"
        [attr.noobserver]="noObserver() ? '' : null"
        [style.color]="color()"
        [style.font-size]="size() ? size() + 'px' : null"
      />
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    span {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class NgxIconComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly config = inject(NGX_ICONIFY_CONFIG, { optional: true });

  /** Tracks whether to render inline SVG (SSR fallback) or the web component */
  private readonly useSvgFallback = signal<boolean>(true);

  // ── Inputs ──

  /** Iconify icon identifier, e.g. "mdi:home" or "lucide:arrow-right" */
  readonly icon = input.required<string>();

  /** Explicit width in pixels (overrides size) */
  readonly width = input<number | string>();

  /** Explicit height in pixels (overrides size) */
  readonly height = input<number | string>();

  /** Convenience shorthand — sets both width and height */
  readonly size = input<number>();

  /** Flip transformation */
  readonly flip = input<IconFlip>();

  /** Rotation: "90", "180", "270" or degrees */
  readonly rotate = input<string | number>();

  /** Rendering mode for the web component */
  readonly mode = input<IconMode>();

  /** Render icon inline (aligns to text baseline) */
  readonly inline = input<boolean>(false);

  /** Disable intersection observer for lazy loading */
  readonly noObserver = input<boolean>(false);

  /** CSS color for the icon (replaces currentColor in monotone icons) */
  readonly color = input<string>();

  // ── Computed display dimensions ──

  readonly displayWidth = computed<number | undefined>(() => {
    if (this.size()) return this.size();
    const w = this.width();
    return typeof w === 'number' ? w : undefined;
  });

  readonly displayHeight = computed<number | undefined>(() => {
    if (this.size()) return this.size();
    const h = this.height();
    return typeof h === 'number' ? h : undefined;
  });

  // ── SVG fallback content (SSR-safe) ──

  readonly svgContent = computed<SafeHtml | null>(() => {
    if (!this.useSvgFallback()) return null;

    const iconLookup = lookupIcon(this.icon(), this.config?.offlineCollections);
    if (!iconLookup) return null;

    const w = this.displayWidth() ?? iconLookup.width;
    const h = this.displayHeight() ?? iconLookup.height;
    const color = this.color();

    // Replace currentColor in the SVG body if a color is specified
    let body = iconLookup.body;
    if (color) {
      body = body.replace(/currentColor/g, color);
    }

    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg"`,
      ` width="${w}" height="${h}"`,
      ` viewBox="0 0 ${iconLookup.width} ${iconLookup.height}"`,
      `>${body}</svg>`,
    ].join('');

    return this.sanitizer.bypassSecurityTrustHtml(svg);
  });

  // ── Lifecycle ──

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // On the client, start with SVG fallback (matches SSR HTML for hydration).
      // After the first render, wait for the web component to register, then
      // switch seamlessly — the user never sees an empty state.
      afterNextRender({
        write: () => {
          customElements
            .whenDefined('iconify-icon')
            .then(() => this.useSvgFallback.set(false))
            .catch(() => {
              // If for some reason iconify-icon never loads, the SVG fallback
              // stays visible — graceful degradation.
            });
        },
      });
    }
  }
}
