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
