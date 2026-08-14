import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgxIconify } from 'ngx-iconify-stack';

interface Schematic {
  name: string;
  command: string;
  purpose: string;
}

@Component({
  selector: 'docs-schematics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxIconify],
  templateUrl: './schematics.component.html',
})
export class SchematicsComponent {
  readonly dynamicManifestCode = `export const dynamicSubsetIcons = ['mdi:home', 'mdi:user'] as const;`;

  readonly regenerateCode = `npm run ngx-iconify-stack:generate-icons

# or directly:
ng g ngx-iconify-stack:generate-icon-subset --project <name>

# Nx workspaces:
nx g ngx-iconify-stack:generate-icon-subset --project <name>`;

  readonly schematics: Schematic[] = [
    {
      name: 'generate-icon-subset',
      command: 'ng g ngx-iconify-stack:generate-icon-subset --project <name>',
      purpose:
        'Scans templates for icon="prefix:name" literals, merges the dynamic-icon manifest, builds src/ngx-iconify/icon-subset.ts, declares + installs missing @iconify-json/* sets, wires prebuild, and patches the provider.',
    },
    {
      name: 'add-icon',
      command: 'ng g ngx-iconify-stack:add-icon --project <name> --icon mdi:home (repeatable)',
      purpose:
        'Validates prefix:name, installs the set if missing, appends the icon to src/ngx-iconify/icon-manifest.ts (idempotent), and regenerates the subset through the same pipeline.',
    },
    {
      name: 'skill',
      command: 'ng g ngx-iconify-stack:skill --project <name>',
      purpose:
        'Regenerates the AI agent skill under .agents/skills/ngx-iconify-stack and declares the @iconify/collections devDependency for the read-only catalog tools.',
    },
    {
      name: 'list-sets',
      command:
        'ng g ngx-iconify-stack:list-sets --project <name> [--search <term>] [--category <name>] [--limit <N>]',
      purpose:
        'Lists real Iconify sets from the catalog (read-only, never installs). Use BEFORE choosing a set so you never invent one.',
    },
    {
      name: 'validate-set',
      command: 'ng g ngx-iconify-stack:validate-set --project <name> --prefix <prefix>',
      purpose:
        'Confirms a set exists in the catalog and prints its metadata + samples (read-only).',
    },
    {
      name: 'validate-icon',
      command:
        'ng g ngx-iconify-stack:validate-icon --project <name> --icon <prefix>:<name> (repeatable)',
      purpose:
        'Validates that an icon reference is well-formed AND the set/icon actually exist (read-only); fails hard on unknown sets/icons.',
    },
  ];
}
