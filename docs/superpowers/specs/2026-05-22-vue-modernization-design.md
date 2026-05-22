# Extentie — Modernization to Vue 3 + Vite

**Date:** 2026-05-22
**Status:** Approved design — ready for implementation planning

## Goal

Full modernization of Extentie, a published Manifest V3 Chrome extension for
managing installed extensions, apps, and themes from a popup. Replace the
ageing stack (webpack, LitElement v2, JSHint, plain ES6) with a modern one
(Vue 3, Vite, TypeScript, ESLint), restructure the imperative `popup.js` into
components, fix latent bugs, and clean up i18n rot — while keeping the product
behaviour and visual design essentially unchanged.

## Decisions

| Topic | Decision |
|---|---|
| Scope | Full modernization |
| Framework | Vue 3 (latest, 3.5.x), `<script setup lang="ts">`, Composition API |
| Build | Vite + `@crxjs/vite-plugin` (v2) + `@vitejs/plugin-vue` |
| Language | TypeScript, `strict: true` |
| UI parity | Keep overall design; fix bugs + light polish (a11y, consistency) |
| Testing | Vitest, unit tests only (pure functions) |
| State | One module-scoped composable (`useExtensions`) — no Pinia (YAGNI) |

## Non-goals

- No UI redesign (layout, spacing, interactions stay as-is).
- No Chrome Web Store submission — this refactor ends at a verified local build.
- No component/DOM test suite — unit tests for pure functions only.

## Architecture

The popup and options page each become a standard Vue 3 app mounted into a thin
`index.html`. No web components / Shadow DOM (a popup is a page we fully own);
SFCs use `<style scoped lang="scss">`. The shared khroma theme stays global
SCSS (CSS custom properties + `prefers-color-scheme`), which works naturally
without Shadow DOM.

### Project structure

```
manifest.config.ts          # CRXJS defineManifest; version read from package.json
vite.config.ts              # Vite + @crxjs/vite-plugin + @vitejs/plugin-vue
tsconfig.json               # strict: true
eslint.config.js            # flat config: typescript-eslint + eslint-plugin-vue + prettier
.prettierrc
package.json                # version is the single source of truth
public/                     # _locales, icons  (copied verbatim)
src/
  popup/    index.html  main.ts  Popup.vue
  options/  index.html  main.ts  Options.vue
  components/
    ExtGroup.vue      # one titled section (header counts + rows)
    ExtItem.vue       # one row (was <ext-list> — a row, not a list)
    SearchBar.vue     # the search input
  composables/
    useExtensions.ts  # reactive list + toggle / uninstall / launch
    useSettings.ts    # chrome.storage.sync setting
  lib/
    extensions.ts     # chrome.management adapter (typed, promise-based)
    theme.ts          # dark-mode detection + action-icon switching
    i18n.ts           # chrome.i18n.getMessage helper -> t(key)
    sort.ts  filter.ts  icon.ts   # pure functions — unit tested
  styles/khroma/      # shared SCSS theme
  types.ts
test/                 # Vitest specs for sort / filter / icon
```

### Components & data flow

```
Popup.vue
 ├─ SearchBar.vue        v-model -> useExtensions().query
 └─ ExtGroup.vue x3      props: title, items, counts   (v-if items.length)
     └─ ExtItem.vue xN   props: ext (one ExtensionInfo)
```

- `Popup.vue` — calls `useExtensions().load()` on mount; renders the search bar
  and three groups from the computed lists. Reads `useSettings()` to hide the
  search bar when the setting is off.
- `ExtGroup.vue` — pure presentational: header (`enabled / total`) plus rows;
  self-hides when empty.
- `ExtItem.vue` — one row (icon, name, enable checkbox, action buttons). Calls
  `useExtensions()` actions directly — idiomatic for an app this small, no event
  plumbing through `ExtGroup`.
- `Options.vue` — one checkbox bound to `useSettings()`.

### Shared state — `useExtensions.ts`

A module-scoped composable acting as the store:

```
all      ref<ExtensionInfo[]>   — every installed item
query    ref<string>            — current search text
load()                          — all.value = await listExtensions()
extensions / apps / themes       — computed: categorized -> filtered -> sorted
counts                           — computed: { enabled, total } per category
setEnabled(id, on) · uninstall(id) · launch(id) · openOptions(url)
```

It subscribes to `chrome.management.onEnabled/onDisabled/onUninstalled/
onInstalled` and reloads, so counts and the list stay correct automatically.
This deletes the original's fragile manual count bookkeeping — counts are
derived, never incremented by hand.

`useSettings.ts` — `searchEnabled` ref loaded from and persisted to
`chrome.storage.sync`.

### `lib/` layer (no Vue, independently testable)

- `extensions.ts` — typed `async` wrappers over `chrome.management`
  (`getAll`, `setEnabled`, `uninstall`, `launchApp`) and `chrome.tabs.create`.
- `theme.ts` — `applyTheme()`: detect dark mode (incl. incognito) and set the
  action icon. The dead `chrome.runtime.sendMessage` is removed.
- `i18n.ts` — `t(key)` over `chrome.i18n.getMessage`.
- `sort.ts` — enabled-first then case-insensitive alphabetical; pure, no mutation.
- `filter.ts` — case-insensitive name substring filter; pure.
- `icon.ts` — `pickIcon()`: smallest icon larger than 16px, fallback to largest;
  no array mutation (replaces the convoluted reversing `getIcon`).

`types.ts` — `categorize(ext)` -> `'extension' | 'app' | 'theme'` (theme by
`type`, app by `isApp`, else extension), plus shared type aliases.

## Bug fixes & light polish

| # | Issue today | Fix |
|---|---|---|
| 1 | `mayEnable`/`mayDisable` read but never used — the checkbox toggles extensions that cannot be toggled and fails silently | `ExtItem` disables the checkbox when `mayDisable === false` (enabled item) or `mayEnable === false` (disabled item) |
| 2 | Duplicate `class` attribute on the themes list in `popup.html` | Gone — markup is component-rendered |
| 3 | Dead `chrome.runtime.sendMessage({ isBrowserDark })` (no receiver exists) | Removed |
| 4 | `getIcon` mutates its input array via `.reverse()` | Pure `pickIcon()` |
| 5 | Pointless `Promise` wrapper around search | Reactive `computed` filter |
| 6 | Manual enabled-count `++`/`--` bookkeeping | Derived `computed` counts + live `chrome.management` events |
| 7 | Action buttons are `<a href="#">`; delete is `tabindex="-1"` (keyboard users cannot uninstall) | Real `<button>` elements, keyboard-reachable, i18n'd `aria-label`s |

## i18n cleanup

- Remove the typo key `ext_short_ame` (unused; also missing from `zh_CN`).
- Remove the dead `data-aria-msg` mechanism; give the search field a real
  i18n `aria-label` via a new `search` key (referenced today but never existed).
- Wire up `delete_this` / `open_option` (keys exist but `extList.js` ignored
  them) for action labels; add a `launch` key.
- Replace the hardcoded "Enabled search" string on the options page with a new
  i18n key.
- Remove `gotoWebStore` / `gotoExtension` — confirmed unused, deleted from all
  locale files.
- After cleanup, the `en` and `zh_CN` key sets must match exactly. New keys and
  their translations (authored from the function each serves):

  | key | `en` | `zh_CN` |
  |---|---|---|
  | `search` | Search extensions by name | 按名称搜索扩展程序 |
  | `launch` | Launch | 启动 |
  | `show_search_bar` | Show search bar | 显示搜索栏 |

## Tooling

- ESLint flat config (`typescript-eslint` + `eslint-plugin-vue` +
  `eslint-config-prettier`), Prettier, `tsconfig` `strict: true`.
- `.claude/hooks/jshint-lint.sh` rewritten to run ESLint on edited `.ts`/`.vue`
  files (no `.js` source remains).
- `package.json` scripts: `dev`, `build`, `lint`, `format`, `test`.
- Version: `package.json` `version` becomes the single source of truth, set to
  `1.6.3` (the real shipped version); `manifest.config.ts` imports it.
- Build output: Vite convention `dist/` (was `build/`); `CLAUDE.md` and
  `.gitignore` updated to match.
- Remove `size-plugin.json`.

### Dependencies dropped

`lit-element`, `webpack`, `webpack-cli`, `webpack-merge`, `copy-webpack-plugin`,
`mini-css-extract-plugin`, `css-loader`, `file-loader`, `sass-loader`,
`size-plugin`, JSHint, and the dead Svelte config in `webpack.common.js`.

### Dependencies added

`vue`, `vite`, `@vitejs/plugin-vue`, `@crxjs/vite-plugin`, `typescript`,
`vue-tsc`, `sass`, `vitest`, `eslint`, `typescript-eslint`,
`eslint-plugin-vue`, `eslint-config-prettier`, `prettier`,
`@types/chrome` (current).

## Testing

Vitest, unit tests only — `sort.test.ts`, `filter.test.ts`, `icon.test.ts`
covering the pure functions. chrome.* APIs are not exercised by tests.

## Docs to update

- `CLAUDE.md` — stack, commands, architecture, conventions, build folder.
- `new-lit-component` skill — obsolete; replace with a `new-vue-component`
  skill describing the SFC conventions.
- `add-i18n-string` skill — rewrite step 4 (the `data-msg` / `popup.js`
  mechanism) for the Vue `t()` helper.

## Risks & notes

- Published extension: parity is verified by building and loading `dist/`
  unpacked. No Web Store submission is part of this work.
- `chrome.management` promise support: used natively via `await`. If
  `minimum_chrome_version: 88` predates promise support for any method used,
  bump `minimum_chrome_version` modestly rather than re-introduce callbacks.
- `@crxjs/vite-plugin` is v2 — stable and the de-facto MV3 standard.

## Verification

1. `yarn build` produces a working `dist/`.
2. Load `dist/` unpacked in `chrome://extensions`; confirm the popup lists
   extensions/apps/themes, search filters, toggles enable/disable, uninstall
   and launch work, the options toggle hides/shows the search bar, and
   dark/light theming follows `prefers-color-scheme`.
3. `yarn lint`, `yarn test` pass.
