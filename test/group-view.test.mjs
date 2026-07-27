import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { groupByType, groupByUserGroups, ungrouped, searchGroups, searchExtensions } from '@/utils/group-view'

const ext = (id, name, extra = {}) => ({ id, name, type: 'extension', enabled: true, ...extra })
const names = group => group.extensions.map(extension => extension.name)

describe('groupByType', () => {
    const titleOf = type => ({ extension: 'Extensions', theme: 'Themes' })[type] ?? type

    test('puts each extension under the title for its type', () => {
        const groups = groupByType([
            ext('a', 'A'),
            ext('t', 'T', { type: 'theme' }),
            ext('b', 'B'),
        ], titleOf)

        assert.deepEqual([...groups.keys()], ['Extensions', 'Themes'])
        assert.deepEqual(names(groups.get('Extensions')), ['A', 'B'])
    })

    test('falls back to the raw type when there is no title', () => {
        const groups = groupByType([ext('x', 'X', { type: 'hosted_app' })], titleOf)

        assert.deepEqual([...groups.keys()], ['hosted_app'])
    })

    test('sorts by name', () => {
        const groups = groupByType([ext('c', 'Charlie'), ext('a', 'alpha'), ext('b', 'Bravo')], titleOf)

        assert.deepEqual(names(groups.get('Extensions')), ['alpha', 'Bravo', 'Charlie'])
    })

    test('puts the extensions the snapshot says were enabled first, still by name', () => {
        const extensions = [ext('a', 'A'), ext('b', 'B'), ext('c', 'C'), ext('d', 'D')]
        const enabled = new Map([['a', false], ['b', true], ['c', false], ['d', true]])

        assert.deepEqual(names(groupByType(extensions, titleOf, enabled).get('Extensions')), ['B', 'D', 'A', 'C'])
    })

    // Otherwise a row slides out from under the cursor while the user is toggling.
    test('keeps the order the snapshot fixed when live state moves on', () => {
        const enabled = new Map([['a', true], ['b', false]])
        const extensions = [ext('a', 'A', { enabled: false }), ext('b', 'B', { enabled: true })]

        assert.deepEqual(names(groupByType(extensions, titleOf, enabled).get('Extensions')), ['A', 'B'])
    })

    test('treats an extension the snapshot never saw as disabled', () => {
        const groups = groupByType([ext('a', 'A'), ext('new', 'New')], titleOf, new Map([['a', true]]))

        assert.deepEqual(names(groups.get('Extensions')), ['A', 'New'])
    })

    test('returns nothing for no extensions', () => {
        assert.equal(groupByType([], titleOf).size, 0)
    })
})

describe('groupByUserGroups', () => {
    const extensions = [ext('aaa', 'Adblock'), ext('bbb', 'Bitwarden')]

    test('keeps the order the user set', () => {
        const groups = groupByUserGroups(extensions, [{ id: 'g1', name: 'Work', order: ['bbb', 'aaa'] }])

        assert.deepEqual(names(groups.get('g1')), ['Bitwarden', 'Adblock'])
    })

    test('drops ids for extensions that are no longer installed', () => {
        const groups = groupByUserGroups(extensions, [{ id: 'g1', name: 'Work', order: ['aaa', 'gone'] }])

        assert.deepEqual(names(groups.get('g1')), ['Adblock'])
    })

    test('keeps a group the user emptied', () => {
        const groups = groupByUserGroups(extensions, [{ id: 'g1', name: 'Work', order: [] }])

        assert.deepEqual(names(groups.get('g1')), [])
    })

    test('gives an unnamed group an empty name rather than undefined', () => {
        const groups = groupByUserGroups(extensions, [{ id: 'g1', order: [] }])

        assert.equal(groups.get('g1').name, '')
    })

    // A group id comes from a backup file the user was invited to import.
    for (const id of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
        test(`a group id of '${id}' cannot reach Object.prototype`, () => {
            const groups = groupByUserGroups(extensions, [{ id, name: 'Imported', order: ['aaa'] }])

            assert.deepEqual(names(groups.get(id)), ['Adblock'], 'the group did not survive the round trip')
            assert.equal({}.extensions, undefined, 'Object.prototype was polluted')
            assert.equal({}.name, undefined, 'Object.prototype was polluted')
        })
    }
})

describe('ungrouped', () => {
    const extensions = [ext('aaa', 'Adblock'), ext('bbb', 'Bitwarden'), ext('ccc', 'Cookies')]

    test('returns the extensions no group claims, sorted by name', () => {
        const group = ungrouped(extensions, [{ id: 'g1', name: 'Work', order: ['bbb'] }], 'Others')

        assert.deepEqual(names(group), ['Adblock', 'Cookies'])
        assert.equal(group.name, 'Others')
    })

    test('returns nothing when every extension is grouped', () => {
        const group = ungrouped(extensions, [{ id: 'g1', name: 'All', order: ['aaa', 'bbb', 'ccc'] }], 'Others')

        assert.deepEqual(names(group), [])
    })
})

describe('searchExtensions', () => {
    const extensions = [
        ext('a', 'Adblock Plus', { shortName: 'abp' }),
        ext('b', 'Bitwarden', { shortName: 'Bitwarden' }),
        ext('c', 'Cookie Editor'),
    ]

    test('matches on name', () => {
        assert.deepEqual(searchExtensions('cookie', extensions).map(e => e.id), ['c'])
    })

    test('matches on short name', () => {
        assert.deepEqual(searchExtensions('abp', extensions).map(e => e.id), ['a'])
    })

    test('ignores case on both, including the term', () => {
        assert.deepEqual(searchExtensions('ABP', extensions).map(e => e.id), ['a'])
        assert.deepEqual(searchExtensions('bitWARDEN', extensions).map(e => e.id), ['b'])
    })

    // chrome.management omits shortName for some entries despite the type.
    test('tolerates an extension with no short name', () => {
        assert.deepEqual(searchExtensions('editor', extensions).map(e => e.id), ['c'])
    })

    test('returns everything for an empty term', () => {
        assert.equal(searchExtensions('', extensions).length, 3)
    })

    test('returns nothing when nothing matches', () => {
        assert.deepEqual(searchExtensions('zzz', extensions), [])
    })
})

describe('searchGroups', () => {
    const groups = new Map([
        ['g1', { id: 'g1', name: 'Work', extensions: [ext('a', 'Adblock Plus'), ext('b', 'Bitwarden')] }],
        ['g2', { id: 'g2', name: 'Fun', extensions: [ext('c', 'Cookies')] }],
    ])

    test('leaves out a group with no match', () => {
        assert.deepEqual([...searchGroups('adblock', groups).keys()], ['g1'])
    })

    test('ignores case', () => {
        assert.deepEqual(names(searchGroups('ADBLOCK', groups).get('g1')), ['Adblock Plus'])
    })

    test('puts a name that starts with the term first', () => {
        const withBoth = new Map([['g1', {
            id: 'g1',
            name: 'Work',
            extensions: [ext('a', 'Super Blocker'), ext('b', 'Blocker Pro')],
        }]])

        assert.deepEqual(names(searchGroups('blocker', withBoth).get('g1')), ['Blocker Pro', 'Super Blocker'])
    })

    test('does not touch the groups it was given', () => {
        searchGroups('adblock', groups)

        assert.deepEqual(names(groups.get('g1')), ['Adblock Plus', 'Bitwarden'])
        assert.equal(groups.size, 2)
    })

    test('matches everything for an empty term', () => {
        assert.equal(searchGroups('', groups).size, 2)
    })
})
