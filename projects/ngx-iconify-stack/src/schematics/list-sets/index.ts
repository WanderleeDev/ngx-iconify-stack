import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { ListSetsOptions } from './schema';
import { readCollections } from '../catalog';
import { detectPackageManager, resolveProject } from '../utils';

interface Row {
  prefix: string;
  name: string;
  total: number;
  category: string;
}

export function listSets(options: ListSetsOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    await resolveProject(tree, options);

    const catalog = readCollections(tree);
    if (catalog === null) {
      const pm = detectPackageManager(tree);
      throw new SchematicsException(
        `@iconify/collections is not installed — install it with: ${pm} install -D @iconify/collections`,
      );
    }

    const search = options.search?.toLowerCase();
    const rows: Row[] = [];
    for (const prefix of Object.keys(catalog)) {
      const info = catalog[prefix] ?? {};
      if (options.category !== undefined && info.category !== options.category) continue;
      if (search) {
        const name = (info.name ?? '').toLowerCase();
        if (!prefix.toLowerCase().includes(search) && !name.includes(search)) continue;
      }
      rows.push({
        prefix,
        name: info.name ?? '',
        total: typeof info.total === 'number' ? info.total : 0,
        category: info.category ?? '',
      });
    }

    const shown = rows.slice(0, options.limit ?? Infinity);

    context.logger.info(`Available icon sets (${Object.keys(catalog).length})`);
    if (shown.length === 0) return;

    const prefixWidth = Math.max(8, ...shown.map((row) => row.prefix.length));
    const nameWidth = Math.max(4, ...shown.map((row) => row.name.length));
    for (const row of shown) {
      context.logger.info(
        `${row.prefix.padEnd(prefixWidth)}  ${row.name.padEnd(nameWidth)}  ` +
          `${String(row.total).padStart(6)}  ${row.category}`,
      );
    }
  };
}