import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { applyImportedGroups } from '@/utils/group-merge'

const ids = groups => groups.map(group => group.id)

describe('applyImportedGroups, replace', () => {
    test('keeps every imported group and discards the existing ones', () => {
        const result = applyImportedGroups(
            [{ id: 'old', name: 'Old', order: ['z'] }],
            [{ id: 'a', name: 'A', order: ['x'] }, { id: 'b', name: 'B', order: ['y'] }],
            'replace')

        assert.deepEqual(ids(result), ['a', 'b'])
        assert.ok(!result.some(group => group.order.includes('z')))
    })

    test('gives a duplicated id a fresh one', () => {
        const result = applyImportedGroups([], [
            { id: 'dup', name: 'One', order: ['x'] },
            { id: 'dup', name: 'Two', order: ['y'] },
        ], 'replace')

        assert.equal(new Set(ids(result)).size, 2)
    })

    test('keeps an extension in the first group that claims it', () => {
        const result = applyImportedGroups([], [
            { id: 'a', name: 'A', order: ['x'] },
            { id: 'b', name: 'B', order: ['x', 'y'] },
        ], 'replace')

        assert.deepEqual(result.map(group => group.order), [['x'], ['y']])
    })
})

describe('applyImportedGroups, merge', () => {
    test('appends into an existing group with the same name', () => {
        const result = applyImportedGroups(
            [{ id: 'work', name: 'Work', order: ['x'] }],
            [{ id: 'w2', name: 'work', order: ['x', 'y'] }],
            'merge')

        assert.equal(result.length, 1)
        assert.deepEqual(result[0].order, ['x', 'y'])
    })

    test('adds a group whose name is new', () => {
        const result = applyImportedGroups(
            [{ id: 'work', name: 'Work', order: ['x'] }],
            [{ id: 'fun', name: 'Fun', order: ['y'] }],
            'merge')

        assert.deepEqual(ids(result), ['work', 'fun'])
    })

    test('never emits two groups with the same id', () => {
        const result = applyImportedGroups(
            [{ id: 'dup', name: 'One', order: ['x'] }],
            [{ id: 'dup', name: 'Two', order: ['y'] }],
            'merge')

        assert.equal(new Set(ids(result)).size, result.length)
    })

    test('keeps every extension in at most one group', () => {
        const result = applyImportedGroups(
            [{ id: 'a', name: 'A', order: ['x'] }],
            [{ id: 'b', name: 'B', order: ['x', 'y'] }, { id: 'c', name: 'C', order: ['y', 'z'] }],
            'merge')

        const all = result.flatMap(group => group.order)
        assert.equal(new Set(all).size, all.length)
    })

    test('leaves an existing group untouched when the import adds nothing', () => {
        const existing = [{ id: 'work', name: 'Work', order: ['x'] }]
        const result = applyImportedGroups(existing, [{ id: 'w2', name: 'Work', order: ['x'] }], 'merge')

        assert.deepEqual(result, existing)
    })

    test('does not add a group whose extensions are all already grouped', () => {
        const result = applyImportedGroups(
            [{ id: 'work', name: 'Work', order: ['x', 'y'] }],
            [{ id: 'imp', name: 'Imported', order: ['x', 'y'] }],
            'merge')

        assert.deepEqual(result, [{ id: 'work', name: 'Work', order: ['x', 'y'] }])
    })
})
