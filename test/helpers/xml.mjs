// A DOMParser stand-in covering the shape parseSimpleExtManagerBackup relies on:
// `<group>` nodes each holding a `<key>` and a `<val>`, plus parse-error reporting.
// It is deliberately small — tests that need real XML conformance do not belong here.
const parseError = {
    querySelector: selector => (selector === 'parsererror' ? { textContent: 'parse error' } : null),
    querySelectorAll: () => [],
}

function isWellFormed(text) {
    if (!/^\s*<\w/.test(text)) return false

    const open = []
    for (const [, closing, name, selfClosing] of text.matchAll(/<(\/?)([\w:-]+)[^>]*?(\/?)>/g)) {
        if (selfClosing) continue
        if (!closing) open.push(name)
        else if (open.pop() !== name) return false
    }
    return open.length === 0
}

export function installDomParser() {
    globalThis.DOMParser = class {
        parseFromString(text) {
            if (!isWellFormed(text)) return parseError

            const groups = [...text.matchAll(/<group>([\s\S]*?)<\/group>/g)].map(([, body]) => ({
                querySelector: tag => {
                    const value = (body.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)) ?? [])[1]
                    return value === undefined ? null : { textContent: value }
                },
            }))

            return {
                querySelector: () => null,
                querySelectorAll: selector => (selector === 'group' ? groups : []),
            }
        }
    }
}
