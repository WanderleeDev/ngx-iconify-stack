import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  OnInit,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type IconFlip = 'horizontal' | 'vertical' | 'both';
export type IconMode = 'svg' | 'bg' | 'mask' | 'style';

/**
 * Angular wrapper for the `iconify-icon` web component.
 * Handles lazy-loading the WC bundle only in the browser (SSR-safe).
 *
 * @example
 * <ngx-icon icon="mdi:home" [size]="24" />
 */
@Component({
  selector: 'ngx-icon',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (icon()) {
      <iconify-icon
        [attr.icon]="icon()"
        [attr.width]="width()"
        [attr.height]="height()"
        [attr.flip]="flip() ?? null"
        [attr.rotate]="rotate() ?? null"
        [attr.mode]="mode() ?? null"
        [attr.inline]="inline() ? '' : null"
        [attr.noobserver]="noObserver() ? '' : null"
        [style.color]="color()"
        [style.font-size]="size() ? size() + 'px' : null"
      ></iconify-icon>
    } @else {
      loading
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `,
})
export class NgxIconComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  /** Iconify icon identifier, e.g. "mdi:home" or "lucide:arrow-right" */
  readonly icon = input.required<string>();

  /** Explicit width in pixels (overrides size) */
  readonly width = input<number | string>();

  /** Explicit height in pixels (overrides size) */
  readonly height = input<number | string>();

  /** Convenience shorthand — sets both width and height via font-size */
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

  /** CSS color for the icon */
  readonly color = input<string>();

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Lazy-import the web component only in the browser.
      // The import is side-effect only (registers the custom element).
      import('iconify-icon');
    }
  }
}
