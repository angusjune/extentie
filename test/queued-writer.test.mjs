import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createQueuedWriter } from '@/utils/queued-writer'

/** A stand-in for OptionsSync.set: read, merge, write, with each step yielding. */
function storage({ latencyMs = 0 } = {}) {
    const tick = () => new Promise(resolve => setTimeout(resolve, latencyMs))
    const state = { stored: { a: 0, b: 0 }, writes: 0 }

    return Object.assign(state, {
        async set(patch) {
            const current = (await tick(), { ...state.stored })
            await tick()
            state.stored = { ...current, ...patch }
            state.writes++
        },
    })
}

describe('createQueuedWriter', () => {
    test('writes what it was given', async () => {
        const store = storage()
        const writer = createQueuedWriter(store.set, { delayMs: 0 })

        writer.queue({ a: 1 })
        await writer.settled()

        assert.deepEqual(store.stored, { a: 1, b: 0 })
    })

    // Two direct set() calls would each read the state from before the other.
    test('does not lose one of two overlapping changes', async () => {
        const store = storage({ latencyMs: 1 })
        const writer = createQueuedWriter(store.set, { delayMs: 0 })

        writer.queue({ a: 1 })
        writer.queue({ b: 2 })
        await writer.settled()

        assert.deepEqual(store.stored, { a: 1, b: 2 })
    })

    test('folds a burst into a single write', async () => {
        const store = storage()
        const writer = createQueuedWriter(store.set, { delayMs: 0 })

        for (let value = 1; value <= 30; value++) writer.queue({ a: value })
        await writer.settled()

        assert.equal(store.writes, 1, 'one drag of a slider should not be 30 writes')
        assert.equal(store.stored.a, 30)
    })

    test('keeps the last value when the same key is set repeatedly', async () => {
        const store = storage()
        const writer = createQueuedWriter(store.set, { delayMs: 0 })

        writer.queue({ a: 1 })
        writer.queue({ a: 2 })
        writer.queue({ a: 3 })
        await writer.settled()

        assert.equal(store.stored.a, 3)
    })

    test('holds a change for the delay before writing', async () => {
        const store = storage()
        const writer = createQueuedWriter(store.set, { delayMs: 50 })

        writer.queue({ a: 1 })
        assert.equal(store.writes, 0, 'wrote immediately')

        await writer.settled()
        assert.equal(store.writes, 1)
    })

    test('writes again after the queue has drained', async () => {
        const store = storage()
        const writer = createQueuedWriter(store.set, { delayMs: 0 })

        writer.queue({ a: 1 })
        await writer.settled()
        writer.queue({ b: 2 })
        await writer.settled()

        assert.equal(store.writes, 2)
        assert.deepEqual(store.stored, { a: 1, b: 2 })
    })

    test('reports a failed write instead of throwing', async () => {
        const errors = []
        const writer = createQueuedWriter(
            async () => { throw new Error('quota exceeded') },
            { delayMs: 0, onError: (...args) => errors.push(args) })

        writer.queue({ a: 1 })
        await writer.settled()

        assert.equal(errors.length, 1)
        assert.match(errors[0][0], /^Failed to save a:/)
        assert.match(errors[0][1].message, /quota exceeded/)
    })

    test('keeps working after a failed write', async () => {
        const store = storage()
        let failNext = true
        const writer = createQueuedWriter(
            async patch => {
                if (failNext) { failNext = false; throw new Error('nope') }
                await store.set(patch)
            },
            { delayMs: 0, onError: () => {} })

        writer.queue({ a: 1 })
        await writer.settled()
        writer.queue({ a: 2 })
        await writer.settled()

        assert.equal(store.stored.a, 2)
    })

    test('settled resolves when there is nothing to write', async () => {
        const writer = createQueuedWriter(async () => {}, { delayMs: 0 })

        await writer.settled()
    })
})
