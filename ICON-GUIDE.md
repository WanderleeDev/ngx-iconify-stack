# ngx-iconify-stack — Guía de Iconos

## Paquetes oficiales de Iconify disponibles

Este proyecto instala dos paquetes oficiales de Iconify que facilitan trabajar con iconos:

### `@iconify/utils`

Funciones para validar y manipular iconos:

```typescript
import { validateIconName, stringToIcon, getIconData } from '@iconify/utils';

// Validar si un nombre de ícono tiene formato correcto
stringToIcon('mdi:home'); // → { provider: "", prefix: "mdi", name: "home" }
stringToIcon('invalid!!'); // → null
stringToIcon('catppuccin:frappe:home'); // → { provider: "catppuccin", prefix: "frappe", name: "home" }
// Nota: un nombre de tres segmentos es el formato provider:prefix:name de los
// proveedores custom de la API de Iconify — NO es una referencia offline.

// Validar nombre parseado
validateIconName(stringToIcon('mdi:home')); // → true
validateIconName(stringToIcon('invalid!!')); // → false

// Verificar si un ícono existe en un set
import mdi from '@iconify-json/mdi/icons.json';
getIconData(mdi, 'home'); // → { body: '...' }
getIconData(mdi, 'nonexistent'); // → null
```

### `@iconify/collections`

Lista completa de sets disponibles (236 sets):

```typescript
import collections from '@iconify/collections/collections.json';

const allSets = Object.keys(collections); // → ['mdi', 'lucide', 'tabler', ...]
console.log(allSets.length); // → 236

// Info de cada set
console.log(collections['mdi'].name); // "Material Design Icons"
console.log(collections['mdi'].total); // cantidad de íconos
console.log(collections['mdi'].license); // { title: "...", spdx: "..." }
console.log(collections['mdi'].samples); // ["home", "account", ...]
```

---

## Aclaración: nombres `prefix:name` simples en todos los sets offline

**No existe la "limitación double-colon".** Todos los sets `@iconify-json/*` usan nombres simples `prefix:name` (verificado: catppuccin 659 íconos, noto 3375, twemoji 3586 — **cero** nombres contienen `:`; `catppuccin:frappe:home` no existe).

| Punto                                                                                                     | Detalle                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Los sets offline usan nombres simples `prefix:name`                                                       | `stringToIcon('mdi:home')` → `{ provider: '', prefix: 'mdi', name: 'home' }`                                                                                       |
| `getIconData()` hace lookup literal del key                                                               | `getIconData(data, 'home')` busca `data.icons['home']` (o alias) — sin parsing de la ref, seguro para cualquier nombre válido                                         |
| Un nombre de tres segmentos (`a:b:c`) es `provider:prefix:name`                                           | Formato de los proveedores custom de la API de Iconify (requiere provider config o `@`). NO es una referencia de subset offline                                       |
| El scanner y `getIconData`/`getIcons` solo entienden `prefix:name`                                        | Los subsets offline se construyen y resuelven sobre esa forma; un `a:b:c` no pertenece al subset                                                                   |

**Solución:** no hace falta ninguna workaround para subsets offline. Todos los sets funcionan igual. `[forceCdn]="true"` queda disponible solo para casos puntuales en que prefieras cargar un ícono desde el CDN.

---

## Flujo recomendado para agregar iconos

### Caso 1: Íconos estáticos en templates (lo común)

```html
<ngx-iconify icon="mdi:home" /> <ngx-iconify icon="lucide:arrow-right" />
```

1. Escribir los íconos en el template
2. Correr `pnpm run ngx-iconify-stack:generate-icons`
3. El schematic escanea, instala sets faltantes y genera `src/ngx-iconify/icon-subset.ts`

### Caso 2: Íconos dinámicos (desde signals/services)

```typescript
const icon = signal('mdi:home');
```

El scanner **no capturga** íconos dinámicos. Opciones:

```bash
# Agregar al manifest manualmente
ng g ngx-iconify-stack:add-icon --icon mdi:home

# O editar src/ngx-iconify/icon-manifest.ts
export const dynamicSubsetIcons = ['mdi:home', 'lucide:arrow'] as const;
```

Luego correr `generate-icons` de nuevo.

### Caso 3: Validar un ícono antes de usarlo

```typescript
import { validateIconName, stringToIcon } from '@iconify/utils';

function isValidIcon(name: string): boolean {
  const parsed = stringToIcon(name);
  if (!parsed) return false;
  return validateIconName(parsed);
}

isValidIcon('mdi:home'); // true
isValidIcon('invalid!!'); // false
isValidIcon(''); // false
```

### Caso 4: Verificar si un ícono existe en un set

```typescript
import { getIconData } from '@iconify/utils';
import mdi from '@iconify-json/mdi/icons.json';

const icon = getIconData(mdi, 'home');
if (icon) {
  // el ícono existe
} else {
  // no existe en este set
}
```

### Caso 5: Listar todos los sets disponibles

```typescript
import collections from '@iconify/collections/collections.json';

const sets = Object.keys(collections);
// ['material-symbols', 'mdi', 'lucide', 'tabler', ...] (236 total)

// Filtrar por categoría
const general = sets.filter((s) => collections[s].category === 'General');
```

---

## Sets disponibles (236)

La lista completa está en `@iconify/collections`. Algunos de los más populares:

| Set            | Íconos                  | Categoría       |
| -------------- | ----------------------- | --------------- |
| `mdi`          | Material Design Icons   | General         |
| `lucide`       | Lucide                  | General         |
| `tabler`       | Tabler Icons            | General         |
| `heroicons`    | Heroicons               | General         |
| `bi`           | Bootstrap Icons         | General         |
| `fa6-solid`    | Font Awesome 6 Solid    | General         |
| `simple-icons` | Simple Icons (logos)    | Logos           |
| `carbon`       | Carbon (IBM)            | General         |
| `ph`           | Phosphor Icons          | General         |
| `logos`        | SVG Logos               | Logos           |
| `ri`           | Remix Icon              | General         |
| `vscode-icons` | VSCode File Icons       | Files           |
| `devicon`      | Dev Icons (tech stack)  | Tech            |
| `twemoji`      | Twitter Emojis          | Emojis          |
| `catppuccin`   | Catppuccin (coloreados) | Colores       |

Ver `https://icon-sets.iconify.design/` para browsear todos.

---

## Herramientas de catálogo y validación

Para descubrir sets y validar iconos desde la terminal, usá los schematics read-only del skill (nunca escriben archivos, nunca instalan):

```bash
# Listar sets reales del catálogo (usar ANTES de elegir un set — nunca inventar uno)
ng g ngx-iconify-stack:list-sets --project <name> [--search <term>] [--category <name>] [--limit <N>]

# Confirmar que un set existe + metadatos/samples
ng g ngx-iconify-stack:validate-set --project <name> --prefix <prefix>

# Confirmar que un icono existe (--icon es repetible) — nunca inventar un nombre
ng g ngx-iconify-stack:validate-icon --project <name> --icon <prefix>:<name>
```

- Los schematics leen el catálogo de `node_modules/@iconify/collections` y los sets instalados de `node_modules/@iconify-json/<prefix>`.
- El schematic `skill` declara `@iconify/collections` como devDependency y la instala, así los tools funcionan desde el primer uso. Si la dep faltara igualmente, `list-sets` falla con la instrucción de instalación.
- Con el `prefix` devuelto: `ng g ngx-iconify-stack:add-icon --icon <prefix>:<name>` (add-icon sí instala sets faltantes automáticamente).
