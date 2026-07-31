import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import type { IconifyJSON } from '@iconify/types';
import { NgxIconify } from './ngx-iconify';
import { NGX_ICONIFY_CONFIG } from './icon.config';

const mdiSet: IconifyJSON = {
  prefix: 'mdi',
  width: 24,
  height: 24,
  icons: {
    home: {
      body: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>',
      width: 24,
      height: 24,
    },
    wide: {
      body: '<path d="M0 0h24v24H0z" fill="currentColor"/>',
      width: 48,
      height: 32,
    },
  },
};

describe('NgxIconify', () => {
  let fixture: ComponentFixture<NgxIconify>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NgxIconify],
      providers: [
        {
          provide: NGX_ICONIFY_CONFIG,
          useValue: { offlineCollections: [mdiSet] },
        },
      ],
    });
    fixture = TestBed.createComponent(NgxIconify);
  });

  it('renders an inline svg when the icon exists in offlineCollections', () => {
    fixture.componentRef.setInput('icon', 'mdi:home');
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg).not.toBeNull();
    expect(svg.getAttribute('width')).toBe('24');
    expect(svg.getAttribute('height')).toBe('24');
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg.querySelector('path')).not.toBeNull();
  });

  it('replaces currentColor with the configured color in the svg body', () => {
    fixture.componentRef.setInput('icon', 'mdi:home');
    fixture.componentRef.setInput('color', '#ff0000');
    fixture.detectChanges();

    const content = fixture.componentInstance.svgContent();
    expect(content).not.toBeNull();
    expect(String(content)).not.toContain('currentColor');
    expect(String(content)).toContain('#ff0000');
  });

  it('falls back to <iconify-icon> when the icon is not in the subset', () => {
    fixture.componentRef.setInput('icon', 'mdi:does-not-exist');
    fixture.detectChanges();

    expect(fixture.componentInstance.svgContent()).toBeNull();
    expect(fixture.nativeElement.querySelector('svg')).toBeNull();
    const fallback = fixture.nativeElement.querySelector(
      'iconify-icon',
    ) as HTMLElement;
    expect(fallback).not.toBeNull();
    expect(fallback.getAttribute('icon')).toBe('mdi:does-not-exist');
  });

  it('lets the size input override width and height for display dimensions', () => {
    fixture.componentRef.setInput('icon', 'mdi:home');
    fixture.componentRef.setInput('size', 32);
    fixture.detectChanges();

    expect(fixture.componentInstance.displayWidth()).toBe(32);
    expect(fixture.componentInstance.displayHeight()).toBe(32);

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('width')).toBe('32');
    expect(svg.getAttribute('height')).toBe('32');
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
  });

  it('sizes the svg from the width input while keeping the icon viewBox', () => {
    fixture.componentRef.setInput('icon', 'mdi:wide');
    fixture.componentRef.setInput('width', 16);
    fixture.detectChanges();

    expect(fixture.componentInstance.displayWidth()).toBe(16);
    expect(fixture.componentInstance.displayHeight()).toBeUndefined();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('width')).toBe('16');
    expect(svg.getAttribute('height')).toBe('32');
    expect(svg.getAttribute('viewBox')).toBe('0 0 48 32');
  });
});
