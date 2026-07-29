import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxIconComponent, IconFlip, IconMode } from 'ngx-icon-stack';

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

@Component({
  selector: 'docs-demo',
  imports: [NgxIconComponent, FormsModule],
  templateUrl: './demo-section.component.html',
  styles: ``,
})
export class DemoSectionComponent {
  readonly config = signal<SandboxConfig>({
    iconId: 'lucide:zap',
    size: 48,
    color: '#e11d48',
    rotate: 0,
    flip: '',
    mode: '',
    inline: false,
    noObserver: false,
  });

  readonly codeCopied = signal(false);

  readonly generatedCode = computed(() => {
    const cfg = this.config();
    const id = cfg.iconId || 'mdi:help-circle-outline';
    let code = `<ngx-icon icon="${id}"`;

    if (cfg.size !== 24) {
      code += ` [size]="${cfg.size}"`;
    }
    if (cfg.color && cfg.color !== '#ffffff') {
      code += ` color="${cfg.color}"`;
    }
    if (cfg.rotate !== 0) {
      code += ` [rotate]="${cfg.rotate}"`;
    }
    if (cfg.flip) {
      code += ` flip="${cfg.flip}"`;
    }
    if (cfg.mode) {
      code += ` mode="${cfg.mode}"`;
    }
    if (cfg.inline) {
      code += ` [inline]="true"`;
    }
    if (cfg.noObserver) {
      code += ` [noObserver]="true"`;
    }

    code += ' />';
    return code;
  });

  updateConfig<K extends keyof SandboxConfig>(key: K, value: SandboxConfig[K]): void {
    this.config.update(c => ({ ...c, [key]: value }));
  }

  copyCode(): void {
    navigator.clipboard?.writeText(this.generatedCode()).catch(() => {});
    this.codeCopied.set(true);
    setTimeout(() => this.codeCopied.set(false), 1500);
  }

  resetAll(): void {
    this.config.set({
      iconId: 'lucide:zap',
      size: 48,
      color: '#e11d48',
      rotate: 0,
      flip: '',
      mode: '',
      inline: false,
      noObserver: false,
    });
  }
}
