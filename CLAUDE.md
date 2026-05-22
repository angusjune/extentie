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
