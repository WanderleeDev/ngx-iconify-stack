import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { callRule } from '@angular-devkit/schematics';
import { lastValueFrom } from 'rxjs';

/**
 * Run a schematic rule to completion against a tree, following the same
 * protocol the SchematicEngine uses (`callRuleAsync`): the rule may return
 * a tree, a thunk returning another rule, or an Observable<Tree>. This
 * avoids depending on the module-resolution of `SchematicTestRunner` (which
 * cannot load TS factories without a compiled collection).
 */
export async function runRule(rule: Rule, tree: Tree, context: SchematicContext): Promise<Tree> {
  return lastValueFrom(callRule(rule, tree, context));
}
