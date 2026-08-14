import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { ValidateSetOptions } from './schema';
import { IconifySetInfo, readCollections } from '../catalog';
import { detectPackageManager, resolveProject } from '../utils';

function heightLabel(height: IconifySetInfo['height']): string {
  if (height === undefined) return '—';
  return Array.isArray(height) ? height.join('/') : String(height);
}

export function validateSet(options: ValidateSetOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    await resolveProject(tree, options);

    if (!options.prefix) {
      throw new SchematicsException(
        'No set prefix provided — pass --prefix <prefix>, e.g. --prefix mdi.',
      );
    }

    const catalog = readCollections(tree);
    if (catalog === null) {
      const pm = detectPackageManager(tree);
      throw new SchematicsException(
        `@iconify/collections is not installed — install it with: ${pm} install -D @iconify/collections.`,
      );
    }

    const info = catalog[options.prefix];
    if (!info) {
      throw new SchematicsException(
        `Set "${options.prefix}" does not exist in the Iconify catalog — list real sets with: ` +
          `ng g ngx-iconify-stack:list-sets --search ${options.prefix}.`,
      );
    }

    context.logger.info(
      `✓ Set "${options.prefix}" exists in the Iconify catalog (${info.name ?? options.prefix})`,
    );
    context.logger.info(`  total: ${info.total ?? '—'} icons`);
    context.logger.info(`  category: ${info.category ?? '—'}`);
    context.logger.info(`  height: ${heightLabel(info.height)}`);
    context.logger.info(`  palette: ${info.palette ?? '—'}`);
    const license = info.license;
    context.logger.info(
      `  license: ${license?.title ?? '—'}${license?.spdx ? ` (${license.spdx})` : ''}`,
    );
    const samples = (info.samples ?? []).slice(0, 6);
    context.logger.info(`  samples: ${samples.length > 0 ? samples.join(', ') : '—'}`);
  };
}