import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { installDomParser } from './helpers/xml.mjs'
import { parseGroupBackup, serializeGroups } from '@/utils/group-backup'

before(installDomParser)

describe('serializeGroups', () => {
    test('a backup it writes imports back unchanged', () => {
        const groups = [
            { id: 'work', name: 'Work', order: ['aaa', 'bbb'] },
            { id: 'fun', name: 'Fun', order: ['ccc'] },
        ]

        assert.deepEqual(parseGroupBackup(serializeGroups(groups, [{ id: 'aaa', name: 'A' }])), groups)
    })

    test('records the names of the extensions it knows about', () => {
        const backup = JSON.parse(serializeGroups(
            [{ id: 'work', name: 'Work', order: ['aaa', 'unknown'] }],
            [{ id: 'aaa', name: 'Adblock' }],
        ))

        assert.deepEqual(backup.extensionNames, { aaa: 'Adblock' })
    })
})

describe('parseGroupBackup', () => {
    const parseOne = raw => parseGroupBackup(JSON.stringify({ groups: [raw] }))[0]

    test('rejects an empty file', () => {
        assert.throws(() => parseGroupBackup('   '), /empty/i)
    })

    test('rejects a file that is not JSON', () => {
        assert.throws(() => parseGroupBackup('{ nope'), /not valid JSON/i)
    })

    test('rejects an HTML page picked by mistake', () => {
        assert.throws(() => parseGroupBackup('<!doctype html><html><body>nope</body></html>'))
    })

    test('rejects a file with no list of groups', () => {
        assert.throws(() => parseGroupBackup('{"format":"extentie-groups"}'), /no list of groups/i)
    })

    test('accepts a bare array of groups', () => {
        assert.equal(parseGroupBackup('[]').length, 0)
    })

    test('reads the `userGroups` shape written by storage', () => {
        const groups = parseGroupBackup(JSON.stringify({ userGroups: [{ id: 'a', name: 'A', order: [] }] }))
        assert.equal(groups.length, 1)
    })

    test('replaces an id that would not be a safe DOM id', () => {
        assert.match(parseOne({ id: '"><img src=x>', name: 'X', order: [] }).id, /^[A-Za-z0-9_-]+$/)
    })

    test('falls back to a default name when there is none', () => {
        assert.equal(parseOne({ id: 'a', order: [] }).name, 'New Group')
        assert.equal(parseOne({ id: 'a', name: '   ', order: [] }).name, 'New Group')
    })

    test('truncates an overlong name', () => {
        assert.equal(parseOne({ id: 'a', name: 'x'.repeat(200), order: [] }).name.length, 40)
    })

    test('drops anything in `order` that is not an extension id', () => {
        assert.deepEqual(parseOne({ id: 'a', name: 'A', order: ['ok', { x: 1 }, null, 42, '  '] }).order, ['ok'])
    })

    test('de-duplicates `order`', () => {
        assert.deepEqual(parseOne({ id: 'a', name: 'A', order: ['x', 'x', 'y'] }).order, ['x', 'y'])
    })

    test('rejects an `order` that is not a list', () => {
        assert.throws(() => parseOne({ id: 'a', name: 'A', order: 'xyz' }), /without a list of extensions/i)
    })

    test('rejects a group that is not an object', () => {
        assert.throws(() => parseGroupBackup('["nope"]'), /not an object/i)
    })

    // A group id is used as an object key and as a DOM id downstream.
    for (const id of ['__proto__', 'constructor', 'prototype', 'toString', 'valueOf', 'hasOwnProperty']) {
        test(`replaces the reserved id '${id}'`, () => {
            assert.notEqual(parseOne({ id, name: 'Imported', order: [] }).id, id)
        })
    }

    // Popup.vue owns these ids for the groups it synthesises.
    for (const id of ['others', 'extension', 'theme', 'app']) {
        test(`replaces the system id '${id}'`, () => {
            assert.notEqual(parseOne({ id, name: 'Imported', order: [] }).id, id)
        })
    }
})

describe('parseGroupBackup, SimpleExtManager format', () => {
    test('imports groups from its XML', () => {
        const [group] = parseGroupBackup(
            '<ExtGrpBakV2><group><key>GRP-Work</key><val>{"items":["aaa","bbb"]}</val></group></ExtGrpBakV2>')

        assert.equal(group.name, 'Work')
        assert.deepEqual(group.order, ['aaa', 'bbb'])
    })

    // Only asserts that the code consults the parser's error report — how faithfully
    // a given string parses is the browser's business, not this suite's.
    test('rejects XML the parser reports an error for', () => {
        assert.throws(() => parseGroupBackup('<ExtGrpBakV2><group></ExtGrpBakV2>'), /not valid XML/i)
    })

    test('rejects a group whose payload is not JSON', () => {
        assert.throws(
            () => parseGroupBackup('<ExtGrpBakV2><group><key>GRP-A</key><val>{ nope</val></group></ExtGrpBakV2>'),
            /malformed group/i)
    })
})
