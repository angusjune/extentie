import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { parseCollapsedGroups, serializeCollapsedGroups } from '@/utils/collapsed-groups'

describe('parseCollapsedGroups', () => {
    test('reads the JSON text written today', () => {
        assert.deepEqual(parseCollapsedGroups('["others","theme"]'), ['others', 'theme'])
    })

    // Chrome stored a plain array before commit 1a52ff9, and there are no migrations.
    test('reads the array a pre-2023 profile still holds', () => {
        assert.deepEqual(parseCollapsedGroups(['others']), ['others'])
    })

    test('gives up on a value that is not JSON rather than throwing', () => {
        assert.deepEqual(parseCollapsedGroups('others'), [])
        assert.deepEqual(parseCollapsedGroups('{ nope'), [])
    })

    test('gives up on JSON that is not a list', () => {
        assert.deepEqual(parseCollapsedGroups('{"a":1}'), [])
        assert.deepEqual(parseCollapsedGroups('42'), [])
    })

    test('drops entries that are not ids', () => {
        assert.deepEqual(parseCollapsedGroups('["ok",null,7,{"a":1}]'), ['ok'])
    })

    test('handles a missing value', () => {
        assert.deepEqual(parseCollapsedGroups(undefined), [])
        assert.deepEqual(parseCollapsedGroups(null), [])
    })
})

describe('serializeCollapsedGroups', () => {
    test('round trips', () => {
        const ids = ['others', 'work']

        assert.deepEqual(parseCollapsedGroups(serializeCollapsedGroups(ids)), ids)
    })

    test('round trips nothing', () => {
        assert.deepEqual(parseCollapsedGroups(serializeCollapsedGroups([])), [])
    })
})
