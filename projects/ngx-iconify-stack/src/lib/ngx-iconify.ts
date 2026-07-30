import { IconFlip, IconMode } from './types';
import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';

@Component({
  selector: 'ngx-icon',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
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
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class NgxIconComponent {
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
}
