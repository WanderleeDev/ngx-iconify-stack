import { IconMode } from './types';
import { lookupIcon } from './icon-helpers';
import { NGX_ICONIFY_CONFIG } from './icon.config';
import {
  Component,
  input,
  computed,
  inject,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA,
  booleanAttribute,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Angular component wrapping Iconify with SSR-safe inline SVG rendering.
 *
 * **SSR + client**: if the icon is found in `offlineCollections`, renders
 * an inline `<svg>` directly in the HTML — no flicker, no hydration gap,
 * no unnecessary DOM replacement.
 *
 * **CDN fallback**: icons not in the subset fall through to the native
 * `<iconify-icon>` web component, which resolves them from the Iconify CDN.
 *
 * **Per-icon CDN bypass**: set `[forceCdn]="true"` on an icon that IS in the
 * subset but that you want resolved from the CDN anyway (e.g. a rarely-used
 * icon you chose not to include in the generated subset). It skips the offline
 * lookup and renders the `<iconify-icon>` web component for that icon.
 *
 * `mode` and `noObserver` are CDN-fallback-only passthroughs to the
 * `<iconify-icon>` web component; they are no-ops for inline subset icons.
 *
 * `flip`/`rotate` are intentionally NOT part of the public API: use CSS
 * transforms via the `class` input instead. Note that a CSS `transform` does
 * not swap the layout box, so rotating non-square icons 90°/270° may overflow
 * — the web component's `rotate` attribute handles this, but the wrapper does
 * not expose it.
 *
 * @example
 * ```html
 * <ngx-iconify icon="mdi:home" [size]="24" />
 * <ngx-iconify icon="lucide:arrow-right" color="#ff0000" />
 * <ngx-iconify icon="mdi:arrow-right" class="scale-x-[-1]" />
 * <ngx-iconify icon="mdi:rare-icon" forceCdn />
 * ```
 */
@Component({
  selector: 'ngx-iconify',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (svgContent(); as safe) {
      <span
        [innerHTML]="safe"
        [attr.class]="class() || null"
        [style.width.px]="displayWidth()"
        [style.height.px]="displayHeight()"
        [style.fontSize.px]="size()"
      ></span>
    } @else {
      <iconify-icon
        [attr.class]="class() || null"
        [attr.icon]="icon()"
        [attr.width]="width()"
        [attr.height]="height()"
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
  // `inline` must be applied to the host, NOT to the child (span / iconify-icon):
  // both children are flex items of the inline-flex host, and vertical-align is
  // ignored on flex items. The host is the element that sits in the text line,
  // so it is the only place where vertical-align has any effect.
  host: {
    '[style.vertical-align]': 'inline() ? "-0.125em" : null',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgxIconify {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly config = inject(NGX_ICONIFY_CONFIG, { optional: true });

  // ── Inputs ──

  /** Iconify icon identifier, e.g. "mdi:home" or "lucide:arrow-right" */
  readonly icon = input.required<string>();

  readonly class = input<string>();

  /** Explicit width (overrides size) */
  readonly width = input<number | string>();

  /** Explicit height (overrides size) */
  readonly height = input<number | string>();

  /** Convenience shorthand — sets both width and height */
  readonly size = input<number | string>();

  /** Rendering mode for the web component */
  readonly mode = input<IconMode>();

  /** Render icon inline (aligns to text baseline) */
  readonly inline = input<boolean>(false, { transform: booleanAttribute });

  /** Force CDN resolution for this icon, even if it exists in the subset */
  readonly forceCdn = input<boolean>(false, { transform: booleanAttribute });

  /** Disable intersection observer for lazy loading */
  readonly noObserver = input<boolean>(false, { transform: booleanAttribute });

  /** CSS color for the icon (replaces currentColor in monotone icons) */
  readonly color = input<string>();

  // ── Computed display dimensions ──

  readonly displayWidth = computed<string>(() => {
    const value = this.width() ?? this.size();
    return value === undefined ? "16px" : (typeof value === 'number' ? String(value) : value);
  });

  readonly displayHeight = computed<string | undefined>(() => {
    const value = this.height() ?? this.size();
    return value === undefined ? undefined : (typeof value === 'number' ? String(value) : value);
  });

  readonly svgContent = computed<SafeHtml | null>(() => {
    // forceCdn skips the offline lookup so the template falls through to the
    // <iconify-icon> web component, which resolves from the Iconify CDN.
    if (this.forceCdn()) return null;

    const iconLookup = lookupIcon(this.icon(), this.config?.offlineCollections);
    if (!iconLookup) return null;

    const w = this.displayWidth() ?? iconLookup.width;
    const h = this.displayHeight() ?? iconLookup.height;
    const color = this.color();

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
}
