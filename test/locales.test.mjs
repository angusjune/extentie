import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'

const SRC = new URL('../src/', import.meta.url)
const LOCALES = new URL('../public/_locales/', import.meta.url)

async function sourceFiles(dir = SRC) {
    const entries = await readdir(dir, { withFileTypes: true })
    const files = await Promise.all(entries.map(entry => {
        const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir)
        return entry.isDirectory() ? sourceFiles(url) : /\.(ts|vue)$/.test(entry.name) ? [url] : []
    }))
    return files.flat()
}

async function usedKeys() {
    const keys = new Map()
    for (const file of await sourceFiles()) {
        for (const [, key] of (await readFile(file, 'utf8')).matchAll(/\bmsg\(\s*'([A-Za-z0-9_]+)'/g)) {
            keys.set(key, file.pathname.split('/src/')[1])
        }
    }
    return keys
}

const localeNames = (await readdir(LOCALES, { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)

const load = name => readFile(new URL(`${name}/messages.json`, LOCALES), 'utf8').then(JSON.parse)

describe('translations', () => {
    test('there is more than one locale to compare', () => {
        assert.ok(localeNames.length > 1, `found ${localeNames.join(', ')}`)
    })

    for (const locale of localeNames) {
        // A key with no entry makes chrome.i18n.getMessage return '', so the label
        // renders blank rather than falling back to English.
        test(`${locale} defines every key the source asks for`, async () => {
            const [messages, used] = await Promise.all([load(locale), usedKeys()])
            const missing = [...used].filter(([key]) => !(key in messages))

            assert.deepEqual(missing.map(([key, file]) => `${key} (${file})`), [])
        })

        test(`${locale} gives every message a non-empty string`, async () => {
            const messages = await load(locale)
            const blank = Object.entries(messages)
                .filter(([, entry]) => typeof entry?.message !== 'string' || entry.message.trim() === '')

            assert.deepEqual(blank.map(([key]) => key), [])
        })
    }

    test('every locale defines the same keys as en', async () => {
        const en = Object.keys(await load('en')).sort()

        for (const locale of localeNames.filter(name => name !== 'en')) {
            assert.deepEqual(Object.keys(await load(locale)).sort(), en, `${locale} differs from en`)
        }
    })

    test('en has no key the source never asks for', async () => {
        const [messages, used] = await Promise.all([load('en'), usedKeys()])
        // Referenced by the manifest rather than by msg().
        const fromManifest = ['ext_name', 'ext_desc']

        assert.deepEqual(Object.keys(messages).filter(key => !used.has(key) && !fromManifest.includes(key)), [])
    })
})
