// Preloaded via `node --test --import`. Lets the tests import the real `src/*.ts`
// modules: Node strips the types, this maps the `@/` alias Vite resolves at build
// time, and the extension APIs the modules touch are stubbed.
import { registerHooks } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const SRC = fileURLToPath(new URL('../../src/', import.meta.url))

registerHooks({
    resolve(specifier, context, nextResolve) {
        if (specifier.startsWith('@/')) {
            return { url: pathToFileURL(`${SRC}${specifier.slice(2)}.ts`).href, shortCircuit: true }
        }
        return nextResolve(specifier, context)
    },
})

const messages = JSON.parse(
    await (await import('node:fs/promises')).readFile(
        new URL('../../public/_locales/en/messages.json', import.meta.url), 'utf8'),
)

globalThis.chrome ??= {
    i18n: {
        // Mirrors chrome.i18n.getMessage: unknown keys resolve to an empty string.
        getMessage: (key, substitutions = []) => {
            const entry = messages[key]
            if (!entry) return ''
            return Object.entries(entry.placeholders ?? {}).reduce(
                (text, [name, { content }]) =>
                    text.replaceAll(`$${name.toUpperCase()}$`, substitutions[Number(content.slice(1)) - 1] ?? ''),
                entry.message,
            )
        },
    },
}
