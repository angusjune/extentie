import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { moveExtensionsToGroup } from '@/utils/group-move'

const groups = () => [
    { id: 'a', name: 'A', order: ['one', 'two'] },
    { id: 'b', name: 'B', order: ['three'] },
    { id: 'o', name: 'O', order: ['four'] },
]

describe('moveExtensionsToGroup', () => {
    test('moves an extension between distant groups', () => {
        const moved = moveExtensionsToGroup(groups(), ['one'], 'o')

        assert.deepEqual(moved.map(group => group.order), [
            ['two'],
            ['three'],
            ['four', 'one'],
        ])
    })

    test('moves extensions from multiple sources in the supplied order', () => {
        const moved = moveExtensionsToGroup(groups(), ['three', 'one', 'ungrouped'], 'o')

        assert.deepEqual(moved.map(group => group.order), [
            ['two'],
            [],
            ['four', 'three', 'one', 'ungrouped'],
        ])
    })

    test('moves grouped extensions to Ungrouped', () => {
        const moved = moveExtensionsToGroup(groups(), ['two', 'three'], null)

        assert.deepEqual(moved.map(group => group.order), [
            ['one'],
            [],
            ['four'],
        ])
    })

    test('keeps selected extensions already in the destination in place', () => {
        const moved = moveExtensionsToGroup(groups(), ['four', 'one'], 'o')

        assert.deepEqual(moved[2].order, ['four', 'one'])
    })

    test('does not duplicate a selected extension in the destination', () => {
        const duplicated = groups()
        duplicated[2].order = ['four', 'four']

        const moved = moveExtensionsToGroup(duplicated, ['four'], 'o')

        assert.deepEqual(moved[2].order, ['four'])
    })

    test('returns the original groups for an empty or no-op move', () => {
        const original = groups()

        assert.equal(moveExtensionsToGroup(original, [], 'o'), original)
        assert.equal(moveExtensionsToGroup(original, ['four'], 'o'), original)
        assert.equal(moveExtensionsToGroup(original, ['one'], 'missing'), original)
    })

    test('does not mutate the groups it was given', () => {
        const original = groups()
        const snapshot = structuredClone(original)

        moveExtensionsToGroup(original, ['one'], 'o')

        assert.deepEqual(original, snapshot)
    })
})
