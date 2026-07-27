import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { isUsableGroupId, toGroupId, sanitizeGroupIds } from '@/utils/group-id'

describe('isUsableGroupId', () => {
    test('accepts a plain id', () => {
        assert.ok(isUsableGroupId('work'))
        assert.ok(isUsableGroupId('a1b2-c3_d4'))
        assert.ok(isUsableGroupId('6f9619ff-8b86-d011-b42d-00c04fc964ff'))
    })

    test('rejects an id that would not be a safe DOM id', () => {
        for (const id of ['', 'has space', '"><img src=x>', 'a.b', 'a#b', 'a/b']) {
            assert.equal(isUsableGroupId(id), false, `accepted ${JSON.stringify(id)}`)
        }
    })

    test('rejects a value that is not a string', () => {
        for (const id of [undefined, null, 42, {}, ['a']]) {
            assert.equal(isUsableGroupId(id), false, `accepted ${JSON.stringify(id)}`)
        }
    })

    // A group id is used to look the group up, so these would resolve to
    // Object.prototype rather than to a group.
    test('rejects every own property of Object.prototype', () => {
        for (const id of Object.getOwnPropertyNames(Object.prototype)) {
            assert.equal(isUsableGroupId(id), false, `accepted ${id}`)
        }
    })

    test('rejects the ids the popup builds its own groups under', () => {
        for (const id of ['others', 'extension', 'theme', 'app']) {
            assert.equal(isUsableGroupId(id), false, `accepted ${id}`)
        }
    })
})

describe('toGroupId', () => {
    test('keeps an id it can use', () => {
        assert.equal(toGroupId('work'), 'work')
    })

    test('replaces one it cannot, with something it can', () => {
        for (const id of ['__proto__', 'others', 'has space', 42]) {
            const replacement = toGroupId(id)

            assert.notEqual(replacement, id)
            assert.ok(isUsableGroupId(replacement), `produced an unusable id: ${replacement}`)
        }
    })

    test('gives a different id each time', () => {
        assert.notEqual(toGroupId('__proto__'), toGroupId('__proto__'))
    })
})

describe('sanitizeGroupIds', () => {
    test('returns the same array when every id is usable', () => {
        const groups = [{ id: 'work', name: 'Work', order: [] }]

        assert.equal(sanitizeGroupIds(groups), groups, 'reading looked like an edit')
    })

    test('replaces a stored id that predates the rules', () => {
        const [group] = sanitizeGroupIds([{ id: '__proto__', name: 'Imported', order: ['aaa'] }])

        assert.ok(isUsableGroupId(group.id))
        assert.equal(group.name, 'Imported')
        assert.deepEqual(group.order, ['aaa'])
    })

    test('leaves the usable ids alone', () => {
        const groups = sanitizeGroupIds([
            { id: 'work', name: 'Work', order: [] },
            { id: 'others', name: 'Mine', order: [] },
        ])

        assert.equal(groups[0].id, 'work')
        assert.notEqual(groups[1].id, 'others')
    })

    test('handles no groups', () => {
        assert.deepEqual(sanitizeGroupIds([]), [])
    })
})
