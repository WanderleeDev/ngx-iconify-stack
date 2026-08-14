import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgxIconify } from 'ngx-iconify-stack';

interface CatalogTool {
  name: string;
  icon: string;
  description: string;
  command: string;
}

@Component({
  selector: 'docs-tools',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxIconify],
  templateUrl: './tools.component.html',
})
export class ToolsComponent {
  readonly addIconCommand = 'ng g ngx-iconify-stack:add-icon --icon <prefix>:<name>';

  readonly catalogTools: CatalogTool[] = [
    {
      name: 'list-sets',
      icon: 'mdi:tag-outline',
      description:
        'List real Iconify sets from the catalog — use it BEFORE choosing a set so you never invent one.',
      command:
        'ng g ngx-iconify-stack:list-sets --project <name> [--search <term>] [--category <name>] [--limit <N>]',
    },
    {
      name: 'validate-set',
      icon: 'mdi:server',
      description: 'Confirm a set exists in the catalog and print its metadata + samples.',
      command: 'ng g ngx-iconify-stack:validate-set --project <name> --prefix <prefix>',
    },
    {
      name: 'validate-icon',
      icon: 'mdi:check-circle',
      description:
        'Confirm an icon reference is well-formed AND the set/icon actually exist; fails hard on unknown sets/icons. Never hallucinate an icon name.',
      command: 'ng g ngx-iconify-stack:validate-icon --project <name> --icon <prefix>:<name>',
    },
  ];
}