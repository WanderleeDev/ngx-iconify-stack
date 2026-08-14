import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgxIconify } from 'ngx-iconify-stack';
import { ApiTableSectionComponent } from '../../../components/api-table-section/api-table-section.component';

@Component({
  selector: 'docs-component-docs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxIconify, ApiTableSectionComponent],
  templateUrl: './component-docs.component.html',
})
export class ComponentDocsComponent {
  readonly componentExampleCode = `import { Component } from '@angular/core';
import { NgxIconify } from 'ngx-iconify-stack';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [NgxIconify],
  template: \`
    <ngx-iconify icon="mdi:home" [size]="24" />
    <ngx-iconify icon="lucide:arrow-right" color="#f59e0b" />
    <ngx-iconify icon="tabler:brand-github" inline />
  \`,
})
export class ExampleComponent {}`;
}
