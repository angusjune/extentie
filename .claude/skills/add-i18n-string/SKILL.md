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
   - **manifest (`manifest.config.ts`)** → `__MSG_myKey__`
   - **Vue components / TypeScript** → import `t` from `src/lib/i18n.ts` and
     call `t('myKey')`
5. Run `yarn build` and confirm the string renders in the popup / options page.

## Consistency check

Before finishing, compare the key sets of all locale files — they must match
exactly. Report any pre-existing drift you find (for example, a key present in
`en/messages.json` but missing from `zh_CN/messages.json`) so it can be fixed.
