import { Component, computed, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { NgxIconify, IconFlip, IconMode } from 'ngx-iconify-stack';

export interface SandboxConfig {
  iconId: string;
  size: number;
  color: string;
  rotate: number;
  flip: IconFlip | '';
  mode: IconMode | '';
  inline: boolean;
  noObserver: boolean;
}

const DEFAULTS: SandboxConfig = {
  iconId: 'devicon:angular',
  size: 48,
  color: '#6200f5',
  rotate: 0,
  flip: '',
  mode: '',
  inline: false,
  noObserver: false,
};

@Component({
  selector: 'docs-demo',
  imports: [NgxIconify, FormField],
  templateUrl: './demo-section.component.html',
  styles: `
    :host {
      --color-accent: #6200f5;
    }
  `,
})
export class DemoSectionComponent {
  readonly model = signal<SandboxConfig>({ ...DEFAULTS });
  readonly sandboxForm = form(this.model);

  readonly codeCopied = signal(false);

  readonly sizeProgress = computed(() => {
    const min = 12;
    const max = 128;
    const val = this.model().size;
    const pct = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
    return `${pct}%`;
  });

  readonly rotateProgress = computed(() => {
    const pct = Math.min(100, Math.max(0, (this.model().rotate / 360) * 100));
    return `${pct}%`;
  });

  readonly generatedCode = computed(() => {
    const cfg = this.model();
    const id = cfg.iconId || 'mdi:help-circle-outline';
    let code = `<ngx-iconify icon="${id}"`;

    if (cfg.size !== 24) code += ` [size]="${cfg.size}"`;
    if (cfg.color && cfg.color !== '#fff') code += ` color="${cfg.color}"`;
    if (cfg.rotate !== 0) code += ` [rotate]="${cfg.rotate}"`;
    if (cfg.flip) code += ` flip="${cfg.flip}"`;
    if (cfg.mode) code += ` mode="${cfg.mode}"`;
    if (cfg.inline) code += ` [inline]="true"`;
    if (cfg.noObserver) code += ` [noObserver]="true"`;

    code += ' />';
    return code;
  });

  copyCode(): void {
    navigator.clipboard?.writeText(this.generatedCode()).catch(() => {});
    this.codeCopied.set(true);
    setTimeout(() => this.codeCopied.set(false), 1500);
  }

  resetAll(): void {
    this.model.set({ ...DEFAULTS });
  }
}
