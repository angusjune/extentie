# Vue 3 + Vite Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Extentie's webpack / LitElement v2 / JSHint / ES6 stack with Vue 3, Vite + CRXJS, TypeScript, and ESLint, restructuring the imperative `popup.js` into components and fixing latent bugs.

**Architecture:** The popup and options page each become a Vue 3 app (`<script setup lang="ts">`, Composition API) mounted into a thin `index.html`. A `lib/` layer holds framework-free chrome adapters and pure functions; one module-scoped composable (`useExtensions`) owns reactive state. CRXJS generates `manifest.json` at build time from `manifest.config.ts`.

**Tech Stack:** Vue 3.5, Vite 6, `@crxjs/vite-plugin` v2, TypeScript (strict), Vitest, ESLint 9 (flat config) + Prettier, Dart Sass.

**Reference spec:** `docs/superpowers/specs/2026-05-22-vue-modernization-design.md`

**Conventions for every task:**
- Yarn is the package manager. A hook blocks hand-editing `yarn.lock`; only `yarn` commands may change it.
- Dependency versions below are a *floor* — run `yarn install` and bump to current latest; verify `@crxjs/vite-plugin` v2 is compatible with the installed Vite major.
- Commit after each task with the message shown in its final step.

---

## Task 1: Build tooling & config foundation

Sets up the new build system. The extension will not build until Task 10 (no HTML entries yet); this task is verified by `yarn install` succeeding.

**Files:**
- Create: `package.json` (full rewrite), `tsconfig.json`, `env.d.ts`, `vite.config.ts`, `vitest.config.ts`, `manifest.config.ts`, `eslint.config.js`, `.prettierrc`, `.gitignore` (rewrite)
- Delete: `config/paths.js`, `config/webpack.common.js`, `config/webpack.config.js`, `.jshintrc`, `size-plugin.json`, `public/manifest.json`

- [ ] **Step 1: Replace `package.json`**

```json
{
  "name": "extentie",
  "version": "1.6.3",
  "description": "Manage Chrome extensions",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "lint": "eslint .",
    "typecheck": "vue-tsc --noEmit",
    "format": "prettier --write .",
    "test": "vitest run"
  },
  "dependencies": {
    "vue": "^3.5.13"
  },
  "devDependencies": {
    "@crxjs/vite-plugin": "^2.0.0",
    "@eslint/js": "^9.17.0",
    "@types/chrome": "^0.0.287",
    "@vitejs/plugin-vue": "^5.2.1",
    "eslint": "^9.17.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-vue": "^9.32.0",
    "prettier": "^3.4.2",
    "sass": "^1.83.0",
    "typescript": "^5.7.2",
    "typescript-eslint": "^8.18.0",
    "vite": "^6.0.5",
    "vitest": "^2.1.8",
    "vue-tsc": "^2.2.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["chrome"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noEmit": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "verbatimModuleSyntax": false
  },
  "include": ["src", "test", "manifest.config.ts", "vite.config.ts", "env.d.ts"]
}
```

- [ ] **Step 3: Create `env.d.ts`**

```typescript
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
```

- [ ] **Step 4: Create `manifest.config.ts`**

```typescript
import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: '__MSG_extName__',
  short_name: 'Extentie',
  description: '__MSG_extDesc__',
  version: pkg.version,
  default_locale: 'en',
  minimum_chrome_version: '88',
  icons: { '128': 'icons/icon-128.png' },
  action: {
    default_icon: {
      '16': 'icons/icon-16.png',
      '24': 'icons/icon-24.png',
      '32': 'icons/icon-32.png',
    },
    default_title: '__MSG_extDefaultTitle__',
    default_popup: 'src/popup/index.html',
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: false,
  },
  permissions: ['management', 'storage'],
});
```

Icons stay in `public/icons/`; Vite copies `public/` to the `dist/` root, so the manifest references them as `icons/...`. If CRXJS reports it cannot resolve an icon path during `yarn build`, move the `icons/` folder out of `public/` (e.g. to the project root) and reference the real relative path — CRXJS then hashes and copies them itself.

- [ ] **Step 5: Create `vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';

export default defineConfig({
  plugins: [vue(), crx({ manifest })],
  build: { outDir: 'dist' },
});
```

Also create `vitest.config.ts` (separate from the build config so the CRXJS plugin does not run during tests):

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 6: Create `eslint.config.js`**

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    languageOptions: {
      globals: { chrome: 'readonly' },
    },
    rules: {
      // Popup.vue / Options.vue are page roots — single-word names are fine.
      'vue/multi-word-component-names': 'off',
    },
  },
  prettier,
);
```

- [ ] **Step 7: Create `.prettierrc`**

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 100
}
```

- [ ] **Step 8: Replace `.gitignore`**

```
node_modules
dist
*.log
.DS_Store
```

- [ ] **Step 9: Delete obsolete files**

`public/manifest.json` is removed because CRXJS now generates the manifest from `manifest.config.ts`; a static copy in `public/` would be copied into `dist/` and clash with the generated one.

```bash
git rm config/paths.js config/webpack.common.js config/webpack.config.js .jshintrc size-plugin.json public/manifest.json
rmdir config 2>/dev/null || true
```

- [ ] **Step 10: Install dependencies**

Run: `yarn install`
Expected: completes without error; `node_modules/.bin/vite` and `node_modules/.bin/vitest` exist.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "build: replace webpack/JSHint with Vite + CRXJS + TypeScript + ESLint"
```

---

## Task 2: Shared types & `categorize()`

**Files:**
- Create: `src/types.ts`
- Test: `test/categorize.test.ts`

`chrome.management.ExtensionInfo.type` is one of `extension | hosted_app | packaged_app | legacy_packaged_app | theme | login_screen_extension`. Categorize: theme by `type === 'theme'`, app by `isApp`, everything else an extension.

- [ ] **Step 1: Write the failing test**

Create `test/categorize.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { categorize } from '../src/types';
import type { ExtensionInfo } from '../src/types';

function make(partial: Partial<ExtensionInfo> = {}): ExtensionInfo {
  return {
    id: 'x',
    name: 'X',
    type: 'extension',
    isApp: false,
    enabled: true,
    ...partial,
  } as ExtensionInfo;
}

describe('categorize', () => {
  it('classifies a theme', () => {
    expect(categorize(make({ type: 'theme' }))).toBe('theme');
  });

  it('classifies an app by isApp', () => {
    expect(categorize(make({ type: 'hosted_app', isApp: true }))).toBe('app');
  });

  it('classifies a plain extension', () => {
    expect(categorize(make())).toBe('extension');
  });

  it('prefers theme over isApp', () => {
    expect(categorize(make({ type: 'theme', isApp: true }))).toBe('theme');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test categorize`
Expected: FAIL — cannot find module `../src/types`.

- [ ] **Step 3: Create `src/types.ts`**

```typescript
export type ExtensionInfo = chrome.management.ExtensionInfo;

export type Category = 'extension' | 'app' | 'theme';

/** Classify an installed item into one of the three popup groups. */
export function categorize(ext: ExtensionInfo): Category {
  if (ext.type === 'theme') return 'theme';
  if (ext.isApp) return 'app';
  return 'extension';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test categorize`
Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/types.ts test/categorize.test.ts
git commit -m "feat: add shared types and categorize()"
```

---

## Task 3: `pickIcon()` — pure icon selection

Replaces the convoluted, array-mutating `getIcon` from `popup.js`.

**Files:**
- Create: `src/lib/icon.ts`
- Test: `test/icon.test.ts`

- [ ] **Step 1: Write the failing test**

Create `test/icon.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { pickIcon } from '../src/lib/icon';

describe('pickIcon', () => {
  it('returns empty string when there are no icons', () => {
    expect(pickIcon(undefined)).toBe('');
    expect(pickIcon([])).toBe('');
  });

  it('picks the smallest icon larger than 16px', () => {
    const icons = [
      { size: 16, url: 'a16' },
      { size: 32, url: 'a32' },
      { size: 48, url: 'a48' },
    ];
    expect(pickIcon(icons)).toBe('a32');
  });

  it('ignores input order', () => {
    const icons = [
      { size: 48, url: 'a48' },
      { size: 16, url: 'a16' },
      { size: 32, url: 'a32' },
    ];
    expect(pickIcon(icons)).toBe('a32');
  });

  it('falls back to the largest icon when none exceed 16px', () => {
    const icons = [
      { size: 8, url: 'a8' },
      { size: 16, url: 'a16' },
    ];
    expect(pickIcon(icons)).toBe('a16');
  });

  it('does not mutate the input array', () => {
    const icons = [
      { size: 48, url: 'a48' },
      { size: 16, url: 'a16' },
    ];
    pickIcon(icons);
    expect(icons[0].size).toBe(48);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test icon`
Expected: FAIL — cannot find module `../src/lib/icon`.

- [ ] **Step 3: Create `src/lib/icon.ts`**

```typescript
import type { ExtensionInfo } from '../types';

/** Pick a display icon URL: the smallest icon larger than 16px, else the largest available. */
export function pickIcon(icons: ExtensionInfo['icons']): string {
  if (!icons || icons.length === 0) return '';
  const sorted = [...icons].sort((a, b) => a.size - b.size);
  const aboveBaseline = sorted.find((icon) => icon.size > 16);
  return (aboveBaseline ?? sorted[sorted.length - 1]).url;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test icon`
Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/icon.ts test/icon.test.ts
git commit -m "feat: add pure pickIcon() helper"
```

---

## Task 4: `sortExtensions()` and `filterByName()` — pure list logic

Replaces the inline sort and the pointless `Promise`-wrapped search in `popup.js`.

**Files:**
- Create: `src/lib/sort.ts`, `src/lib/filter.ts`
- Test: `test/sort.test.ts`, `test/filter.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `test/sort.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { sortExtensions } from '../src/lib/sort';
import type { ExtensionInfo } from '../src/types';

function ext(name: string, enabled: boolean): ExtensionInfo {
  return { id: name, name, enabled, type: 'extension', isApp: false } as ExtensionInfo;
}

describe('sortExtensions', () => {
  it('puts enabled items before disabled items', () => {
    const result = sortExtensions([ext('B', false), ext('A', true)]);
    expect(result.map((e) => e.name)).toEqual(['A', 'B']);
  });

  it('sorts alphabetically within the same enabled state, case-insensitively', () => {
    const result = sortExtensions([ext('beta', true), ext('Alpha', true)]);
    expect(result.map((e) => e.name)).toEqual(['Alpha', 'beta']);
  });

  it('does not mutate the input array', () => {
    const input = [ext('B', true), ext('A', true)];
    sortExtensions(input);
    expect(input[0].name).toBe('B');
  });
});
```

Create `test/filter.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { filterByName } from '../src/lib/filter';
import type { ExtensionInfo } from '../src/types';

function ext(name: string): ExtensionInfo {
  return { id: name, name, enabled: true, type: 'extension', isApp: false } as ExtensionInfo;
}

describe('filterByName', () => {
  const items = [ext('AdBlock'), ext('Dark Reader'), ext('uBlock')];

  it('returns all items for an empty query', () => {
    expect(filterByName(items, '')).toHaveLength(3);
    expect(filterByName(items, '   ')).toHaveLength(3);
  });

  it('matches case-insensitively on a substring', () => {
    expect(filterByName(items, 'block').map((e) => e.name)).toEqual(['AdBlock', 'uBlock']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterByName(items, 'zzz')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test sort filter`
Expected: FAIL — cannot find modules `../src/lib/sort` and `../src/lib/filter`.

- [ ] **Step 3: Create `src/lib/sort.ts`**

```typescript
import type { ExtensionInfo } from '../types';

/** Sort enabled items first, then by case-insensitive name. Returns a new array. */
export function sortExtensions(items: ExtensionInfo[]): ExtensionInfo[] {
  return [...items].sort((a, b) => {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}
```

- [ ] **Step 4: Create `src/lib/filter.ts`**

```typescript
import type { ExtensionInfo } from '../types';

/** Case-insensitive substring filter on name. An empty query returns every item. */
export function filterByName(items: ExtensionInfo[], query: string): ExtensionInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => item.name.toLowerCase().includes(q));
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `yarn test sort filter`
Expected: PASS — 6 tests total.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sort.ts src/lib/filter.ts test/sort.test.ts test/filter.test.ts
git commit -m "feat: add pure sortExtensions() and filterByName() helpers"
```

---

## Task 5: Chrome API adapters — `extensions`, `i18n`, `theme`

Framework-free, typed wrappers over the `chrome.*` APIs. No unit tests (they are thin pass-throughs over browser APIs); verified by `yarn typecheck`.

**Files:**
- Create: `src/lib/extensions.ts`, `src/lib/i18n.ts`, `src/lib/theme.ts`

- [ ] **Step 1: Create `src/lib/extensions.ts`**

```typescript
import type { ExtensionInfo } from '../types';

/** List every installed extension, app, and theme. */
export function listExtensions(): Promise<ExtensionInfo[]> {
  return chrome.management.getAll();
}

/** Enable or disable an item. */
export function setEnabled(id: string, enabled: boolean): Promise<void> {
  return chrome.management.setEnabled(id, enabled);
}

/** Uninstall an item. Rejects if the user cancels the confirmation dialog. */
export function uninstall(id: string): Promise<void> {
  return chrome.management.uninstall(id);
}

/** Launch an installed app. */
export function launchApp(id: string): Promise<void> {
  return chrome.management.launchApp(id);
}

/** Open an item's options page in a new tab. */
export function openOptionsPage(url: string): Promise<chrome.tabs.Tab> {
  return chrome.tabs.create({ url });
}
```

- [ ] **Step 2: Create `src/lib/i18n.ts`**

```typescript
/** Look up a localized message from _locales by key. */
export function t(key: string): string {
  return chrome.i18n.getMessage(key);
}
```

- [ ] **Step 3: Create `src/lib/theme.ts`**

```typescript
/** Detect dark mode (including incognito) and switch the toolbar action icon. */
export function applyTheme(): void {
  const dark =
    window.matchMedia('(prefers-color-scheme: dark)').matches ||
    chrome.extension.inIncognitoContext;
  const prefix = dark ? 'icon-light' : 'icon';
  chrome.action.setIcon({
    path: {
      16: `icons/${prefix}-16.png`,
      24: `icons/${prefix}-24.png`,
      32: `icons/${prefix}-32.png`,
    },
  });
}
```

Note: the dead `chrome.runtime.sendMessage({ isBrowserDark })` from `popup.js` is intentionally **not** carried over — no receiver ever existed.

- [ ] **Step 4: Verify types**

Run: `yarn typecheck`
Expected: PASS — no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/extensions.ts src/lib/i18n.ts src/lib/theme.ts
git commit -m "feat: add typed chrome API adapters"
```

---

## Task 6: Composables — `useExtensions` and `useSettings`

The reactive layer. `useExtensions` is a module-scoped singleton acting as the store; `useSettings` wraps `chrome.storage.sync`. No unit tests (Vue reactivity + chrome APIs); verified by `yarn typecheck`.

**Files:**
- Create: `src/composables/useExtensions.ts`, `src/composables/useSettings.ts`

- [ ] **Step 1: Create `src/composables/useExtensions.ts`**

```typescript
import { computed, ref } from 'vue';
import type { Category, ExtensionInfo } from '../types';
import { categorize } from '../types';
import { filterByName } from '../lib/filter';
import { sortExtensions } from '../lib/sort';
import { t } from '../lib/i18n';
import {
  launchApp,
  listExtensions,
  openOptionsPage,
  setEnabled as apiSetEnabled,
  uninstall as apiUninstall,
} from '../lib/extensions';

export interface ExtGroupView {
  id: Category;
  title: string;
  items: ExtensionInfo[];
  enabledCount: number;
  totalCount: number;
}

const all = ref<ExtensionInfo[]>([]);
const query = ref('');
let watching = false;

async function load(): Promise<void> {
  all.value = await listExtensions();
}

/** Subscribe to external install/enable changes so the list stays current. */
function startWatching(): void {
  if (watching) return;
  watching = true;
  const reload = () => {
    void load();
  };
  chrome.management.onInstalled.addListener(reload);
  chrome.management.onUninstalled.addListener(reload);
  chrome.management.onEnabled.addListener(reload);
  chrome.management.onDisabled.addListener(reload);
}

function buildGroup(id: Category, title: string): ExtGroupView {
  const inCategory = all.value.filter((ext) => categorize(ext) === id);
  const items = sortExtensions(filterByName(inCategory, query.value));
  return {
    id,
    title,
    items,
    enabledCount: items.filter((ext) => ext.enabled).length,
    totalCount: items.length,
  };
}

const groups = computed<ExtGroupView[]>(() => [
  buildGroup('extension', t('extensions')),
  buildGroup('app', t('applications')),
  buildGroup('theme', t('themes')),
]);

async function setEnabled(id: string, enabled: boolean): Promise<void> {
  await apiSetEnabled(id, enabled);
  await load();
}

async function uninstall(id: string): Promise<void> {
  try {
    await apiUninstall(id);
  } catch {
    // user cancelled the uninstall confirmation dialog — nothing to do
    return;
  }
  await load();
}

async function launch(id: string): Promise<void> {
  await launchApp(id);
}

async function openOptions(url: string): Promise<void> {
  await openOptionsPage(url);
}

export function useExtensions() {
  return { query, groups, load, startWatching, setEnabled, uninstall, launch, openOptions };
}
```

- [ ] **Step 2: Create `src/composables/useSettings.ts`**

```typescript
import { ref, watch } from 'vue';

const SETTINGS_DEFAULT = { enabledSearch: true };

export function useSettings() {
  const searchEnabled = ref(true);
  let loaded = false;

  async function load(): Promise<void> {
    const stored = await chrome.storage.sync.get(SETTINGS_DEFAULT);
    searchEnabled.value = stored.enabledSearch;
    loaded = true;
  }

  watch(searchEnabled, (value) => {
    if (!loaded) return;
    void chrome.storage.sync.set({ enabledSearch: value });
  });

  return { searchEnabled, load };
}
```

- [ ] **Step 3: Verify types**

Run: `yarn typecheck`
Expected: PASS — no errors.

- [ ] **Step 4: Commit**

```bash
git add src/composables/
git commit -m "feat: add useExtensions and useSettings composables"
```

---

## Task 7: Migrate shared SCSS theme

Moves the khroma partials that are actually used into `src/styles/khroma/` and drops the two dead ones. `_theme.scss` references undefined Sass namespaces (`custom-properties`, `theme-color`, `css`) and is imported by nothing; `_constants.scss` is used only by `_theme.scss`.

**Files:**
- Move: `src/khroma/_body.scss` → `src/styles/khroma/_body.scss` (unchanged)
- Move: `src/khroma/_checkbox.scss` → `src/styles/khroma/_checkbox.scss` (unchanged)
- Create: `src/styles/khroma/_textfield.scss` (modernized rewrite)
- Delete: `src/khroma/_textfield.scss`, `src/khroma/_constants.scss`, `src/khroma/_theme.scss`

- [ ] **Step 1: Move the unchanged partials**

```bash
mkdir -p src/styles/khroma
git mv src/khroma/_body.scss src/styles/khroma/_body.scss
git mv src/khroma/_checkbox.scss src/styles/khroma/_checkbox.scss
git rm src/khroma/_constants.scss src/khroma/_theme.scss src/khroma/_textfield.scss
```

- [ ] **Step 2: Create `src/styles/khroma/_textfield.scss`**

Modernized: deprecated `lighten()`/`darken()` replaced with `color.adjust()`; dead `.kd-body--dark-theme`/`.kd-body--light-theme` selectors and the unused `&--search` modifier removed.

```scss
@use 'sass:color';
@use 'sass:map';

$theme-colors: (
  'background': #f1f3f4,
  'text': rgba(0, 0, 0, 0.35),
  'text-focus': rgba(0, 0, 0, 0.8),
  'outline-focus': #a9c3f7,
  'icon': #686a6e,
);

$theme-colors-dark: (
  'background': #202124,
  'text': rgba(255, 255, 255, 0.45),
  'text-focus': rgba(255, 255, 255, 0.8),
  'outline-focus': #396286,
  'icon': #7c7e83,
);

@mixin theme-kd-textfield($dark-theme: false) {
  $var: if($dark-theme, $theme-colors-dark, $theme-colors);

  @each $style in map.keys($var) {
    --kd-textfield-#{$style}: #{map.get($var, $style)};
  }

  --kd-textfield-background-hover: #{color.adjust(map.get($var, 'background'), $lightness: 1%)};
  --kd-textfield-background-focus: #{color.adjust(map.get($var, 'background'), $lightness: -4%)};
}

.kd-textfield {
  @include theme-kd-textfield($dark-theme: false);

  position: relative;
  width: 100%;
  height: 28px;

  &__input {
    font-size: 14px;
    color: var(--kd-textfield-text);
    background-color: var(--kd-textfield-background);
    width: 100%;
    height: 100%;
    border-radius: 22px;
    border: 0;
    padding-left: 36px;
    text-overflow: ellipsis;
    transition: background linear 0.12s;

    &:hover {
      background: var(--kd-textfield-background-hover);
    }

    &:focus {
      background: var(--kd-textfield-background-focus);
      color: var(--kd-textfield-text-focus);
      text-overflow: clip;
      outline: none;
      box-shadow: 0 0 0 2px var(--kd-textfield-outline-focus);
    }
  }

  &__leading-icon {
    width: 20px;
    position: absolute;
    top: 0;
    left: 8px;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    svg path {
      fill: var(--kd-textfield-icon);
    }
  }
}

@media (prefers-color-scheme: dark) {
  .kd-textfield {
    @include theme-kd-textfield($dark-theme: true);
  }
}
```

If Dart Sass warns about `color.adjust(... $lightness:)`, switch those two lines to `color.scale(..., $lightness: 1%)` / `color.scale(..., $lightness: -4%)`.

- [ ] **Step 3: Verify the directory state**

Run: `ls src/styles/khroma`
Expected: `_body.scss  _checkbox.scss  _textfield.scss` — and `src/khroma/` no longer exists.

These partials are imported and visually verified in Tasks 10–11.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: migrate khroma SCSS theme, drop dead partials"
```

---

## Task 8: `ExtItem.vue` — one extension row

Replaces `src/extList.js`. Fixes the `mayEnable`/`mayDisable` dead feature (#1): the checkbox is disabled when the user cannot change the state. Action buttons become real `<button>`s with i18n'd `aria-label`s (#7). The checkbox visuals come from the global `_checkbox.scss` (imported by `popup.scss` in Task 10) — not duplicated here.

**Files:**
- Create: `src/components/ExtItem.vue`

- [ ] **Step 1: Create `src/components/ExtItem.vue`**

```vue
<script setup lang="ts">
import { computed } from 'vue';
import type { ExtensionInfo } from '../types';
import { pickIcon } from '../lib/icon';
import { t } from '../lib/i18n';
import { useExtensions } from '../composables/useExtensions';

const props = defineProps<{ ext: ExtensionInfo }>();

const { setEnabled, uninstall, launch, openOptions } = useExtensions();

const name = computed(() => props.ext.shortName || props.ext.name);
const icon = computed(() => pickIcon(props.ext.icons));

/** Disable the checkbox when the user is not allowed to change the state. */
const checkboxDisabled = computed(() =>
  props.ext.enabled ? !props.ext.mayDisable : props.ext.mayEnable === false,
);

const showOptions = computed(() => Boolean(props.ext.optionsUrl) && props.ext.enabled);

function onToggle(event: Event): void {
  void setEnabled(props.ext.id, (event.target as HTMLInputElement).checked);
}
</script>

<template>
  <li
    class="ext-item"
    :class="[
      `ext-item--${ext.installType}`,
      { 'ext-item--inactive': !ext.enabled, 'ext-item--app': ext.isApp },
    ]"
  >
    <label class="ext-item__label" :for="`cb-${ext.id}`">
      <input
        :id="`cb-${ext.id}`"
        class="checkbox-native"
        type="checkbox"
        :checked="ext.enabled"
        :disabled="checkboxDisabled"
        @change="onToggle"
      />
      <span class="checkbox-indicator" role="presentation">
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 3L4 6L9 1" stroke="#fff" stroke-width="2" />
        </svg>
      </span>
      <span class="ext-item__icon" :style="{ backgroundImage: `url(${icon})` }" />
      <span class="ext-item__name">{{ name }}</span>
    </label>

    <div class="ext-item__actions">
      <button
        type="button"
        class="ext-item__action ext-item__action--delete"
        :aria-label="`${t('delete_this')} ${name}`"
        @click="uninstall(ext.id)"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M4.5 14.25C4.5 15.075 5.175 15.75 6 15.75H12C12.825 15.75 13.5 15.075 13.5 14.25V5.25H4.5V14.25ZM14.25 3H11.625L10.875 2.25H7.125L6.375 3H3.75V4.5H14.25V3Z"
          />
        </svg>
      </button>

      <button
        v-if="ext.isApp"
        type="button"
        class="ext-item__action"
        :aria-label="`${t('launch')} ${name}`"
        @click="launch(ext.id)"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M14.25 14.25H3.75V3.75H9V2.25H3.75C2.9175 2.25 2.25 2.925 2.25 3.75V14.25C2.25 15.075 2.9175 15.75 3.75 15.75H14.25C15.075 15.75 15.75 15.075 15.75 14.25V9H14.25V14.25ZM10.5 2.25V3.75H13.1925L5.82 11.1225L6.8775 12.18L14.25 4.8075V7.5H15.75V2.25H10.5Z"
          />
        </svg>
      </button>

      <button
        v-if="showOptions"
        type="button"
        class="ext-item__action"
        :aria-label="`${t('open_option')} ${name}`"
        @click="openOptions(ext.optionsUrl!)"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M14.355 9.702C14.382 9.477 14.4 9.243 14.4 9C14.4 8.757 14.382 8.523 14.346 8.298L15.867 7.11C16.002 7.002 16.038 6.804 15.957 6.651L14.517 4.158C14.427 3.996 14.238 3.942 14.076 3.996L12.285 4.716C11.907 4.428 11.511 4.194 11.07 4.014L10.8 2.106C10.773 1.926 10.62 1.8 10.44 1.8H7.55999C7.37999 1.8 7.23599 1.926 7.20899 2.106L6.93899 4.014C6.49799 4.194 6.09299 4.437 5.72399 4.716L3.93299 3.996C3.77099 3.933 3.58199 3.996 3.49199 4.158L2.05199 6.651C1.96199 6.813 1.99799 7.002 2.14199 7.11L3.66299 8.298C3.62699 8.523 3.59999 8.766 3.59999 9C3.59999 9.234 3.61799 9.477 3.65399 9.702L2.13299 10.89C1.99799 10.998 1.96199 11.196 2.04299 11.349L3.48299 13.842C3.57299 14.004 3.76199 14.058 3.92399 14.004L5.71499 13.284C6.09299 13.572 6.48899 13.806 6.92999 13.986L7.19999 15.894C7.23599 16.074 7.37999 16.2 7.55999 16.2H10.44C10.62 16.2 10.773 16.074 10.791 15.894L11.061 13.986C11.502 13.806 11.907 13.563 12.276 13.284L14.067 14.004C14.229 14.067 14.418 14.004 14.508 13.842L15.948 11.349C16.038 11.187 16.002 10.998 15.858 10.89L14.355 9.702V9.702ZM8.99999 11.7C7.51499 11.7 6.29999 10.485 6.29999 9C6.29999 7.515 7.51499 6.3 8.99999 6.3C10.485 6.3 11.7 7.515 11.7 9C11.7 10.485 10.485 11.7 8.99999 11.7Z"
          />
        </svg>
      </button>
      <span v-else-if="!ext.isApp" class="ext-item__action ext-item__action--placeholder" />
    </div>
  </li>
</template>

<style scoped lang="scss">
.ext-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color ease-out 0.2s;

  &:hover {
    background-color: var(--list-focus-bg);
  }

  &--inactive {
    filter: saturate(0);
  }

  &--development {
    background-color: var(--list-dev-bg);
    --list-focus-bg: var(--list-dev-focus-bg);
  }
}

.ext-item__label {
  display: flex;
  align-items: center;
  flex-grow: 1;
  overflow: hidden;
  padding: 12px 0 12px 16px;
  color: var(--primary);
  cursor: default;
  user-select: none;
}

.ext-item__icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-right: 8px;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}

.ext-item__name {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ext-item__actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.ext-item__action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin: 0 5px;
  padding: 0;
  border: 0;
  border-radius: 4px;
  background: transparent;
  opacity: 0.65;
  cursor: pointer;
  transition: opacity ease-out 0.15s;

  &:hover {
    opacity: 1;
  }

  &:focus-visible {
    opacity: 1;
    background-color: var(--list-focus-bg);
    outline: 0;
  }

  svg path {
    fill: var(--list-actions-item-fill);
  }
}

.ext-item__action--delete {
  opacity: 0;
  pointer-events: none;
}

.ext-item:hover .ext-item__action--delete,
.ext-item:focus-within .ext-item__action--delete {
  opacity: 0.65;
  pointer-events: auto;
}

.ext-item__action--delete:hover,
.ext-item__action--delete:focus-visible {
  opacity: 1;
}

.ext-item__action--placeholder {
  cursor: default;
}

.ext-item--app .ext-item__action--placeholder {
  display: none;
}
</style>
```

- [ ] **Step 2: Verify types**

Run: `yarn typecheck`
Expected: PASS — no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ExtItem.vue
git commit -m "feat: add ExtItem.vue (replaces extList.js)"
```

---

## Task 9: `ExtGroup.vue` and `SearchBar.vue`

`ExtGroup` is a titled section that self-hides when empty; `SearchBar` is the search input, driven by `v-model`.

**Files:**
- Create: `src/components/ExtGroup.vue`, `src/components/SearchBar.vue`

- [ ] **Step 1: Create `src/components/ExtGroup.vue`**

```vue
<script setup lang="ts">
import type { ExtGroupView } from '../composables/useExtensions';
import ExtItem from './ExtItem.vue';

defineProps<{ group: ExtGroupView }>();
</script>

<template>
  <section v-if="group.items.length > 0" class="group">
    <header class="group__header">
      <h1 class="group__title">{{ group.title }}</h1>
      <p class="group__count">{{ group.enabledCount }}/{{ group.totalCount }}</p>
    </header>
    <ul class="group__list">
      <ExtItem v-for="ext in group.items" :key="ext.id" :ext="ext" />
    </ul>
  </section>
</template>

<style scoped lang="scss">
.group__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: default;
}

.group__title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
}

.group__count {
  margin: 0;
  font-size: 1rem;
  color: var(--secondary);
}

.group__list {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
```

- [ ] **Step 2: Create `src/components/SearchBar.vue`**

```vue
<script setup lang="ts">
import { t } from '../lib/i18n';

defineProps<{ modelValue: string }>();
defineEmits<{ 'update:modelValue': [value: string] }>();
</script>

<template>
  <div class="search" role="search">
    <div class="kd-textfield">
      <input
        class="kd-textfield__input"
        type="search"
        autocomplete="off"
        autofocus
        :aria-label="t('search')"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <span class="kd-textfield__leading-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z"
          />
        </svg>
      </span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.search {
  position: fixed;
  z-index: 1;
  box-sizing: border-box;
  width: 100%;
  height: 60px;
  padding: 16px;
  background: var(--bg);
}
</style>
```

- [ ] **Step 3: Verify types**

Run: `yarn typecheck`
Expected: PASS — no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ExtGroup.vue src/components/SearchBar.vue
git commit -m "feat: add ExtGroup.vue and SearchBar.vue"
```

---

## Task 10: Popup app — `Popup.vue` + entry point

**Files:**
- Create: `src/popup/Popup.vue`, `src/popup/main.ts`, `src/popup/index.html`, `src/popup/popup.scss`

- [ ] **Step 1: Create `src/popup/popup.scss`**

Global styles for the popup. `_body.scss` (via the `kd-body` class) supplies `--bg`/`--primary`/`--secondary` and the base colours; this file only adds popup-specific custom properties and sizing.

```scss
@use '../styles/khroma/body';
@use '../styles/khroma/checkbox';
@use '../styles/khroma/textfield';

:root {
  --list-focus-bg: #d8eaff;
  --list-dev-bg: #fff3b1;
  --list-dev-focus-bg: #ffe865;
  --list-actions-item-fill: #828282;
  --checkbox-stroke: rgba(0, 0, 0, 0.2);
  --checkbox-checked-container: #1a73e8;
  --checkbox-focus-stroke: rgba(0, 0, 0, 0.36);
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  font-size: 14px;
}

body {
  width: 320px;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

@media (prefers-color-scheme: dark) {
  :root {
    --list-focus-bg: #323542;
    --list-dev-bg: #504636;
    --list-dev-focus-bg: #645641;
    --list-actions-item-fill: #cbcbcb;
    --checkbox-stroke: rgba(255, 255, 255, 0.3);
  }
}
```

- [ ] **Step 2: Create `src/popup/Popup.vue`**

When the search bar is hidden, the top padding drops from 60px to 16px — the old code left a 60px gap behind the hidden bar.

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import SearchBar from '../components/SearchBar.vue';
import ExtGroup from '../components/ExtGroup.vue';
import { useExtensions } from '../composables/useExtensions';
import { useSettings } from '../composables/useSettings';

const { query, groups, load, startWatching } = useExtensions();
const { searchEnabled, load: loadSettings } = useSettings();

onMounted(() => {
  void load();
  startWatching();
  void loadSettings();
});
</script>

<template>
  <SearchBar v-if="searchEnabled" v-model="query" />
  <main class="groups" :class="{ 'groups--no-search': !searchEnabled }">
    <ExtGroup v-for="group in groups" :key="group.id" :group="group" />
  </main>
</template>

<style scoped lang="scss">
.groups {
  padding: 60px 0 16px;
}

.groups--no-search {
  padding-top: 16px;
}
</style>
```

- [ ] **Step 3: Create `src/popup/main.ts`**

```typescript
import { createApp } from 'vue';
import Popup from './Popup.vue';
import { applyTheme } from '../lib/theme';
import './popup.scss';

applyTheme();
createApp(Popup).mount('#app');
```

- [ ] **Step 4: Create `src/popup/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Extentie</title>
  </head>
  <body class="kd-body">
    <div id="app"></div>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: Verify types**

Run: `yarn typecheck`
Expected: PASS — no errors.

- [ ] **Step 6: Commit**

```bash
git add src/popup/
git commit -m "feat: add Vue popup app"
```

---

## Task 11: Options app — `Options.vue` + entry point

**Files:**
- Create: `src/options/Options.vue`, `src/options/main.ts`, `src/options/index.html`, `src/options/options.scss`

- [ ] **Step 1: Create `src/options/options.scss`**

```scss
@use '../styles/khroma/body';
@use '../styles/khroma/checkbox';

:root {
  --checkbox-stroke: rgba(0, 0, 0, 0.2);
  --checkbox-checked-container: #1a73e8;
  --checkbox-focus-stroke: rgba(0, 0, 0, 0.36);
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  font-size: 16px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --checkbox-stroke: rgba(255, 255, 255, 0.3);
  }
}
```

- [ ] **Step 2: Create `src/options/Options.vue`**

```vue
<script setup lang="ts">
import { onMounted } from 'vue';
import { t } from '../lib/i18n';
import { useSettings } from '../composables/useSettings';

const { searchEnabled, load } = useSettings();

onMounted(() => {
  void load();
});
</script>

<template>
  <form class="options">
    <label class="options__row" for="search-toggle">
      <input id="search-toggle" v-model="searchEnabled" class="checkbox-native" type="checkbox" />
      <span class="checkbox-indicator" role="presentation">
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 3L4 6L9 1" stroke="#fff" stroke-width="2" />
        </svg>
      </span>
      {{ t('show_search_bar') }}
    </label>
  </form>
</template>

<style scoped lang="scss">
.options {
  padding: 16px;
}

.options__row {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}
</style>
```

- [ ] **Step 3: Create `src/options/main.ts`**

```typescript
import { createApp } from 'vue';
import Options from './Options.vue';
import './options.scss';

createApp(Options).mount('#app');
```

- [ ] **Step 4: Create `src/options/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Extentie</title>
  </head>
  <body class="kd-body">
    <div id="app"></div>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: Verify the full build**

Both entry points now exist. Run: `yarn build`
Expected: `vue-tsc` passes and Vite writes `dist/` containing `manifest.json`, `src/popup/index.html`, `src/options/index.html`, the bundled JS/CSS, and the copied `icons/` and `_locales/`.

- [ ] **Step 6: Commit**

```bash
git add src/options/
git commit -m "feat: add Vue options app"
```

---

## Task 12: i18n locale cleanup

Removes the typo key `ext_short_ame` and the unused `gotoWebStore` / `gotoExtension` keys; adds `search`, `launch`, and `show_search_bar`. After this task the `en` and `zh_CN` key sets match exactly (11 keys each).

**Files:**
- Modify: `public/_locales/en/messages.json`, `public/_locales/zh_CN/messages.json`

- [ ] **Step 1: Replace `public/_locales/en/messages.json`**

```json
{
  "extName": {
    "message": "Extentie - extension manager"
  },
  "extDesc": {
    "message": "A simple and elegant Chrome extension manager allows you manage your extensions in a popup window."
  },
  "extDefaultTitle": {
    "message": "Manage Extensions"
  },
  "extensions": {
    "message": "Extensions"
  },
  "applications": {
    "message": "Applications"
  },
  "themes": {
    "message": "Themes"
  },
  "delete_this": {
    "message": "Uninstall"
  },
  "open_option": {
    "message": "Settings"
  },
  "launch": {
    "message": "Launch"
  },
  "search": {
    "message": "Search extensions by name"
  },
  "show_search_bar": {
    "message": "Show search bar"
  }
}
```

- [ ] **Step 2: Replace `public/_locales/zh_CN/messages.json`**

```json
{
  "extName": {
    "message": "Extentie - 扩展程序管理器"
  },
  "extDesc": {
    "message": "漂亮而简单的扩展程序管理工具"
  },
  "extDefaultTitle": {
    "message": "管理扩展"
  },
  "extensions": {
    "message": "扩展"
  },
  "applications": {
    "message": "应用"
  },
  "themes": {
    "message": "主题"
  },
  "delete_this": {
    "message": "卸载"
  },
  "open_option": {
    "message": "设置"
  },
  "launch": {
    "message": "启动"
  },
  "search": {
    "message": "按名称搜索扩展程序"
  },
  "show_search_bar": {
    "message": "显示搜索栏"
  }
}
```

- [ ] **Step 3: Verify the key sets match**

Run:

```bash
node -e "const a=Object.keys(require('./public/_locales/en/messages.json')).sort();const b=Object.keys(require('./public/_locales/zh_CN/messages.json')).sort();console.log(JSON.stringify(a)===JSON.stringify(b)?'MATCH '+a.length+' keys':'MISMATCH')"
```

Expected: `MATCH 11 keys`

- [ ] **Step 4: Commit**

```bash
git add public/_locales/
git commit -m "i18n: drop dead keys, add search/launch/show_search_bar"
```

---

## Task 13: Remove legacy source files

Deletes the LitElement/webpack-era source now that the Vue apps replace it.

**Files:**
- Delete: `src/popup.js`, `src/options.js`, `src/extList.js`, `src/popup.scss`, `src/options.scss`, `public/popup.html`, `public/options.html`, `public/img/`

- [ ] **Step 1: Confirm `public/img/` is unreferenced**

Run: `grep -rn "img/" src public/_locales || echo "no references"`
Expected: `no references` — every icon is now an inline SVG in a component.

- [ ] **Step 2: Delete the legacy files**

```bash
git rm src/popup.js src/options.js src/extList.js src/popup.scss src/options.scss \
       public/popup.html public/options.html
git rm -r public/img
```

- [ ] **Step 3: Verify the production build is clean**

Run: `yarn build`
Expected: `vue-tsc` passes; Vite writes `dist/` with no missing-file warnings. `dist/` contains `manifest.json`, the popup and options HTML, bundled JS/CSS, `icons/`, and `_locales/`.

- [ ] **Step 4: Smoke-test in Chrome**

Open `chrome://extensions`, enable Developer mode, "Load unpacked", select `dist/`. Confirm the popup opens and lists extensions. (Full verification is Task 15.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove legacy LitElement/webpack source"
```

---

## Task 14: Update hooks, docs, and skills

Brings the repo's tooling and documentation in line with the new stack.

**Files:**
- Delete: `.claude/hooks/jshint-lint.sh`, `.claude/skills/new-lit-component/`
- Create: `.claude/hooks/eslint-lint.sh`, `.claude/skills/new-vue-component/SKILL.md`
- Modify: `.claude/settings.json`, `CLAUDE.md`, `.claude/skills/add-i18n-string/SKILL.md`

- [ ] **Step 1: Replace the lint hook**

```bash
rm .claude/hooks/jshint-lint.sh
```

Create `.claude/hooks/eslint-lint.sh`:

```bash
#!/usr/bin/env bash
# PostToolUse hook: lint edited JS/TS/Vue files with ESLint.
# Exits 2 with details on stderr so Claude sees and fixes lint errors.
set -uo pipefail

input=$(cat)

file_path=$(printf '%s' "$input" | node -e '
let data = "";
process.stdin.on("data", c => data += c);
process.stdin.on("end", () => {
  try {
    var j = JSON.parse(data);
    process.stdout.write((j.tool_input && j.tool_input.file_path) || "");
  } catch (e) { /* ignore malformed input */ }
});
')

case "$file_path" in
  *.js|*.mjs|*.ts|*.vue) ;;
  *) exit 0 ;;
esac
[ -f "$file_path" ] || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -x "node_modules/.bin/eslint" ] || exit 0

output=$(node_modules/.bin/eslint "$file_path" 2>&1)
status=$?

if [ "$status" -ne 0 ]; then
  {
    echo "ESLint reported issues in ${file_path}:"
    echo "$output"
    echo "Fix the lint errors above before continuing."
  } >&2
  exit 2
fi
exit 0
```

Then: `chmod +x .claude/hooks/eslint-lint.sh`

- [ ] **Step 2: Point `.claude/settings.json` at the new hook**

In `.claude/settings.json`, change the PostToolUse hook command from
`bash "$CLAUDE_PROJECT_DIR/.claude/hooks/jshint-lint.sh"` to
`bash "$CLAUDE_PROJECT_DIR/.claude/hooks/eslint-lint.sh"`.

- [ ] **Step 3: Replace `CLAUDE.md`**

```markdown
# Extentie

A Chrome extension (Manifest V3) that lets users manage their installed
extensions, apps, and themes from a popup window. Published on the Chrome Web
Store.

## Commands

This project uses **Yarn** (`yarn.lock` is committed — never edit it by hand;
a hook blocks that).

- `yarn dev` — Vite dev server with HMR (via `@crxjs/vite-plugin`)
- `yarn build` — type-check, then production build → `dist/`
- `yarn lint` — ESLint over all `.ts` / `.vue` files
- `yarn typecheck` — `vue-tsc` type-check (no emit)
- `yarn test` — Vitest unit tests
- `yarn format` — Prettier write

A hook lints edited `.ts` / `.vue` / `.js` files automatically and reports
errors.

## Loading the extension

Run `yarn build`, then open `chrome://extensions`, enable Developer mode, click
"Load unpacked", and select the `dist/` folder.

## Architecture

- **Stack**: Vue 3 (`<script setup lang="ts">`, Composition API), Vite +
  `@crxjs/vite-plugin`, TypeScript (strict mode).
- **Manifest**: generated at build time from `manifest.config.ts`; `version`
  is read from `package.json`.
- **Entry points**: `src/popup/` (the popup — main UI) and `src/options/` (the
  options page). Each has an `index.html`, a `main.ts` that mounts the root
  component, a root `.vue`, and a `.scss`.
- **Components**: Vue SFCs in `src/components/` — `ExtItem.vue` (one row),
  `ExtGroup.vue` (a titled section), `SearchBar.vue`. Use the
  `/new-vue-component` skill to add one.
- **State**: `src/composables/` — `useExtensions` (module-scoped store:
  reactive list, grouping, actions) and `useSettings` (the search-bar setting).
- **Chrome layer**: `src/lib/` holds framework-free, typed adapters
  (`extensions.ts`, `theme.ts`, `i18n.ts`) and pure functions (`sort.ts`,
  `filter.ts`, `icon.ts`); the pure ones are unit-tested in `test/`.
- **Chrome APIs**: `chrome.management` (list / enable / uninstall / launch) and
  `chrome.storage.sync` (the search-bar setting). Permissions are declared in
  `manifest.config.ts`.
- **Styles**: SCSS — a global per-entry stylesheet plus the shared theme in
  `src/styles/khroma/`. Component styles use `<style scoped lang="scss">`.
  Theme-able values use CSS custom properties; light/dark follows
  `prefers-color-scheme`.
- **Static assets**: everything in `public/` (icons, `_locales`) is copied
  verbatim into `dist/`.

## Internationalization

Strings live in `public/_locales/<lang>/messages.json`. Locales: `en`
(default) and `zh_CN`. **Every user-facing string must exist in all locale
files.** Reference keys via `__MSG_key__` (manifest / static HTML) or the `t()`
helper from `src/lib/i18n.ts` (components / TypeScript). Use the
`/add-i18n-string` skill to keep locales in sync.

## Versioning

`package.json` `version` is the single source of truth; `manifest.config.ts`
reads it. Bump `package.json` to cut a release.

## Conventions

- TypeScript, `strict` mode; ESLint (flat config) + Prettier.
- New components are Vue SFCs in `src/components/` — follow `ExtItem.vue`, or
  use the `/new-vue-component` skill.
- Components never call `chrome.*` inline; they go through a composable in
  `src/composables/`, which calls the adapters in `src/lib/`.
- Pure logic goes in `src/lib/` with a Vitest unit test in `test/`.
```

- [ ] **Step 4: Replace the `new-lit-component` skill with `new-vue-component`**

```bash
rm -rf .claude/skills/new-lit-component
mkdir -p .claude/skills/new-vue-component
```

Create `.claude/skills/new-vue-component/SKILL.md`:

```markdown
---
name: new-vue-component
description: Scaffold a new Vue 3 SFC for the Extentie UI, following the existing ExtItem component conventions.
---

# New Vue component

Extentie's UI is built from Vue 3 single-file components (see
`src/components/ExtItem.vue`). Use this skill to add one consistently.

## Conventions

- One component per file in `src/components/`, PascalCase, e.g.
  `src/components/MyThing.vue`.
- Use `<script setup lang="ts">` (Composition API).
- Declare props with the typed `defineProps<{ ... }>()` form and events with
  `defineEmits<{ ... }>()`.
- Component styles go in `<style scoped lang="scss">`. Use CSS custom
  properties (`var(--...)`) for theme-able values — the shared theme lives in
  `src/styles/khroma/`.
- Do not call `chrome.*` from a component. Read and mutate state through a
  composable in `src/composables/` (e.g. `useExtensions`), which calls the
  adapters in `src/lib/`.
- User-facing text comes from `t('key')` (`src/lib/i18n.ts`).

## Steps

1. Create `src/components/<Name>.vue` with `<script setup lang="ts">`,
   `<template>`, and `<style scoped lang="scss">` blocks.
2. Import and use it from a parent component or an entry root.
3. Add any new user-facing text with the `/add-i18n-string` skill.
4. Run `yarn typecheck` and `yarn build`, then load `dist/` as an unpacked
   extension to verify it renders.
```

- [ ] **Step 5: Update the `add-i18n-string` skill**

Replace the whole contents of `.claude/skills/add-i18n-string/SKILL.md`:

```markdown
---
name: add-i18n-string
description: Add or update a localized message key across every _locales/<lang>/messages.json file. Use when adding or changing user-facing text in the popup or options UI.
disable-model-invocation: true
---

# Add an i18n string

Extentie ships localized strings in `public/_locales/<lang>/messages.json`.
Every user-facing string MUST exist in **all** locale files, or Chrome falls
back to the default locale (`en`) for the missing ones.

Current locales: `en` (default), `zh_CN`.

## Steps

1. Choose a key. Match the existing style in `messages.json` and confirm the
   key does not already exist.
2. Add the entry to **every** file under `public/_locales/*/messages.json`:
   ```json
   "myKey": {
     "message": "English text here"
   }
   ```
3. Provide a real translation for each non-English locale. If you cannot
   translate a locale (e.g. `zh_CN`), ask the user — do not leave English
   text in a non-English file.
4. Reference the key from the UI:
   - **manifest (`manifest.config.ts`) / static HTML** → `__MSG_myKey__`
   - **Vue components / TypeScript** → import `t` from `src/lib/i18n.ts` and
     call `t('myKey')`
5. Run `yarn build` and confirm the string renders in the popup / options page.

## Consistency check

Before finishing, compare the key sets of all locale files — they must match
exactly. Report any pre-existing drift you find (for example, a key present in
`en/messages.json` but missing from `zh_CN/messages.json`) so it can be fixed.
```

- [ ] **Step 6: Commit**

```bash
git add .claude/ CLAUDE.md
git commit -m "docs: update hooks, CLAUDE.md, and skills for the Vue stack"
```

---

## Task 15: Final verification

**Files:** none created — this task verifies the whole result.

- [ ] **Step 1: Auto-format and auto-fix**

```bash
yarn format
npx eslint . --fix
```

This settles Prettier formatting and ESLint-fixable issues (e.g. `eslint-plugin-vue` attribute order / self-closing tags).

- [ ] **Step 2: Lint, type-check, and test**

Run each and confirm all pass:

```bash
yarn lint
yarn typecheck
yarn test
```

Expected: ESLint reports no errors; `vue-tsc` reports no errors; Vitest runs 15 tests, all passing (4 categorize + 5 icon + 3 sort + 3 filter).

- [ ] **Step 3: Production build**

Run: `yarn build`
Expected: completes; `dist/` contains `manifest.json` with `"version": "1.6.3"`.

- [ ] **Step 4: Manual verification in Chrome**

Load `dist/` unpacked (`chrome://extensions` → Developer mode → Load unpacked). Confirm each:

- Popup lists Extensions / Applications / Themes, each group showing the `enabled/total` count; empty groups are hidden.
- Within a group, enabled items sort before disabled, then alphabetically.
- Toggling a checkbox enables/disables the item; the count updates.
- For an item that cannot be toggled (e.g. policy-installed), the checkbox is disabled.
- Hovering a row reveals the uninstall button; keyboard-tabbing to a row's buttons also reveals it. Uninstall prompts and removes the item.
- An app shows a launch button; an enabled item with an options page shows a settings button — both work.
- Typing in the search box filters all groups by name; counts reflect the filtered set.
- The options page toggle hides/shows the popup search bar (reopen the popup to see it).
- Light/dark theming follows the OS `prefers-color-scheme`; the toolbar icon switches accordingly.

- [ ] **Step 5: Commit any formatting changes**

```bash
git add -A
git commit -m "chore: apply final formatting and lint fixes" || echo "nothing to commit"
```

- [ ] **Step 6: Final review**

Confirm `git log --oneline` shows the task-by-task history and the working tree is clean (`git status`).

---

## Done

The extension is now Vue 3 + Vite + TypeScript, fully built into `dist/`, with passing lint/type/test checks and verified behavior. No Chrome Web Store submission is part of this plan — that is a separate, deliberate release step.

