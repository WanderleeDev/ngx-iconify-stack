import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { getIconData, matchIconName, stringToIcon } from '@iconify/utils';
import { ValidateIconOptions } from './schema';
import { closestIconMatches, readCollections, readInstalledSet } from '../catalog';
import { detectPackageManager, resolveProject } from '../utils';

function normalizeIcons(icon: string | string[] | undefined): string[] {
  if (!icon) return [];
  return Array.isArray(icon) ? icon : [icon];
}

export function validateIcon(options: ValidateIconOptions): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    await resolveProject(tree, options);

    const refs = normalizeIcons(options.icon);
    if (refs.length === 0) {
      throw new SchematicsException(
        'No icon provided — pass --icon <prefix:name> (repeatable), e.g. --icon mdi:home.',
      );
    }

    const catalog = readCollections(tree);
    const catalogMissing = catalog === null;
    const packageManager = detectPackageManager(tree);

    let valid = 0;
    let failed = 0;

    for (const ref of refs) {
      // 1. Format validation: parse the ref and pin both segments to the
      // icon-name charset (`matchIconName`). A `a:b:c` provider ref parses,
      // then simply falls through to the prefix lookup like any other ref.
      const parsed = stringToIcon(ref, true);
      if (
        parsed === null ||
        !matchIconName.test(parsed.prefix) ||
        !matchIconName.test(parsed.name)
      ) {
        context.logger.error(
          `Invalid icon reference "${ref}": invalid format — must be prefix:name ` +
            'in lowercase letters/digits/hyphens (e.g. mdi:home).',
        );
        failed++;
        continue;
      }
      const { prefix, name } = parsed;

      // 2. Catalog presence — without it no existence claim can be made.
      if (catalogMissing) {
        context.logger.error(
          `@iconify/collections is not installed — install it with: ${packageManager} ` +
            'install -D @iconify/collections. Icon existence cannot be verified.',
        );
        failed++;
        continue;
      }

      // 3. Set existence in the catalog.
      if (!catalog![prefix]) {
        context.logger.error(
          `Set "${prefix}" does not exist in the Iconify catalog — list real sets with: ` +
            `ng g ngx-iconify-stack:list-sets --search ${prefix}.`,
        );
        failed++;
        continue;
      }

      // 4. Installed set present? A known-but-missing set cannot verify
      // existence — warn clearly, but do not fail the run.
      const installed = readInstalledSet(tree, prefix);
      if (installed === null) {
        context.logger.warn(
          `Set "${prefix}" is known but not installed — install @iconify-json/${prefix} ` +
            '(add-icon does this automatically); icon existence NOT verified.',
        );
        valid++;
        continue;
      }

      // 5. Icon existence within the installed set (alias-aware via
      // @iconify/utils) + closest-match suggestions for typos.
      if (!getIconData(installed, name)) {
        const suggestions = closestIconMatches(installed, name);
        const hint =
          suggestions.length > 0
            ? ` Did you mean ${suggestions.map((s) => `"${prefix}:${s}"`).join(', ')}?`
            : '';
        context.logger.error(
          `Icon "${prefix}:${name}" does not exist in installed set ` +
            `"@iconify-json/${prefix}".${hint}`,
        );
        failed++;
        continue;
      }

      // 6. Pass.
      context.logger.info(`✓ ${prefix}:${name} is valid and exists in @iconify-json/${prefix}`);
      valid++;
    }

    context.logger.info(`${valid}/${refs.length} icons valid`);
    if (failed > 0) {
      throw new SchematicsException(
        `Icon validation failed: ${valid}/${refs.length} icons valid`,
      );
    }
  };
}