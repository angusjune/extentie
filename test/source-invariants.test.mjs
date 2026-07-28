// Facts about the source that no unit seam can reach: manifest claims, template
// bindings, and listener registration. Asserted against the source text because
// the alternative is a DOM test runner, which this project does not carry.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

describe('manifest', () => {
    test('minimum_chrome_version covers the APIs the source uses', async () => {
        const { minimum_chrome_version: declared } = JSON.parse(await read('manifest.json'))

        // Popup.vue calls chrome.runtime.sendMessage(...).then(); runtime messaging
        // promises land in Chrome 99. crypto.randomUUID() needs 92.
        assert.ok(Number(declared) >= 99, `manifest declares Chrome ${declared}`)
    })

    test('the packaged version is the one the release workflow reads', async () => {
        const [manifest, pkg] = await Promise.all([read('manifest.json'), read('package.json')])

        assert.equal(JSON.parse(pkg).version, JSON.parse(manifest).version)
    })
})

describe('background worker', () => {
    test('reacts to extensions installed or removed outside Extentie', async () => {
        const source = await read('src/background.ts')

        // Without these a long-lived Customize tab never learns about outside changes.
        for (const event of ['onInstalled', 'onUninstalled', 'onEnabled', 'onDisabled']) {
            assert.match(source, new RegExp(`chrome\\.management\\.${event}`), `missing ${event}`)
        }
    })

    test('saves through the queued writer rather than writing directly', async () => {
        const source = await read('src/background.ts')
        const handler = source.slice(source.indexOf('chrome.runtime.onMessage'), source.indexOf('chrome.storage.onChanged'))

        // A direct set() is an unsequenced read-modify-write that nothing awaits.
        assert.doesNotMatch(handler, /\b(optionsStorage|userGroupsStorage)\.set\(/)
    })
})

describe('popup templates', () => {
    test('the tab bar moves right for ArrowRight', async () => {
        const source = await read('src/components/ExtTabBar.vue')

        assert.match(source, /@keydown\.right[.\w]*="focusNext"/)
        assert.match(source, /@keydown\.left[.\w]*="focusPrev"/)
    })

    test('the delete key only uninstalls where the delete button is shown', async () => {
        const source = await read('src/components/ExtList.vue')

        // Vue maps .delete to both Delete and Backspace, and the set up page renders
        // focusable rows with showActions=false. The guard may sit on the binding or
        // inside the handler; what matters is that one of them consults showActions.
        const binding = source.match(/@keydown\.delete[.\w]*="([^"]+)"/)
        assert.ok(binding, 'no delete binding found')

        const handler = source.slice(source.indexOf('function onDelete'), source.indexOf('function onOpenOptions'))
        const guarded = binding[1].includes('showActions') || /props\.showActions/.test(handler)

        assert.ok(guarded, 'Backspace uninstalls even when actions are hidden')
    })

    test('rows inside a group get a defined v-for key', async () => {
        const source = await read('src/Customize.vue')
        const inner = source.slice(source.indexOf(':list="group.order"'), source.indexOf(':data-empty-text'))
        const literal = inner.match(/\bitem-key="([^"]+)"/)?.[1]

        // group.order holds plain extension ids. sortablejs-vue3 resolves a string
        // item-key as item[key], so item["id"] is undefined for every row; a bound
        // `:item-key` passes the function straight through and is fine.
        if (literal !== undefined) {
            assert.notEqual('an-extension-id'[literal], undefined,
                `item-key="${literal}" over a string[] gives every row key: undefined`)
        }
    })

    test('cross-list drops discard the DOM node Sortable moved', async () => {
        const source = await read('src/Customize.vue')
        const bindings = source.match(/@add="discardMovedDomElement"/g) ?? []
        const handler = source.slice(
            source.indexOf('function discardMovedDomElement'),
            source.indexOf('// Deleting a group'),
        )

        // sortablejs-vue3 renders its list without synchronising it. Every receiving
        // extension list must discard Sortable's moved node before Vue renders the
        // same extension from the updated group state, or the row appears twice.
        assert.equal(bindings.length, 2, 'not every extension drop target cleans up the moved node')
        assert.match(handler, /queueMicrotask\(\(\) => item\.remove\(\)\)/)
    })

    test('the collapse-all button follows its visibility option', async () => {
        const [popup, settings, storage] = await Promise.all([
            read('src/Popup.vue'),
            read('src/Options.vue'),
            read('src/options-storage.ts'),
        ])

        assert.match(popup, /options\.showGroupCollapseButton/)
        assert.match(popup, /v-if="showGroupCollapseButton"/)
        assert.match(settings, /v-model="options\.showGroupCollapseButton"/)
        assert.match(storage, /showGroupCollapseButton:\s*true/)
    })
})

describe('repository hygiene', () => {
    test('no debug logging ships in src', async () => {
        const files = ['src/Popup.vue', 'src/Customize.vue', 'src/Options.vue', 'src/background.ts']
        const hits = []

        for (const file of files) {
            for (const [index, line] of (await read(file)).split('\n').entries()) {
                if (/^\s*console\.log\(/.test(line)) hits.push(`${file}:${index + 1}`)
            }
        }

        assert.deepEqual(hits, [])
    })
})
