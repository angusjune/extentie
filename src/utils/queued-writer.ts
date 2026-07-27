export interface QueuedWriter<T> {
    /** Records a change to save. Returns as soon as it is queued. */
    queue(patch: Partial<T>): void;
    /** Saves anything still waiting and resolves once the queue is empty. */
    settled(): Promise<void>;
}

/**
 * Collects changes to one storage key and saves them one write at a time.
 *
 * Two things make writing directly unsafe. `OptionsSync.set()` reads, merges and
 * writes as three separate steps, so two calls that overlap each read the state
 * from before the other and the later write drops the earlier change. And Chrome
 * caps `storage.sync` at 120 writes a minute, which a dragged slider or a typed-out
 * group name reaches on its own.
 *
 * So changes are folded together, held briefly, and written in sequence. A failed
 * write is reported rather than thrown: nothing awaits these, and a rejection with
 * no handler would only surface as an unhandled rejection in the worker.
 */
export function createQueuedWriter<T extends object>(
    write: (patch: Partial<T>) => Promise<void>,
    { delayMs = 300, onError = console.error }: { delayMs?: number, onError?: (...args: unknown[]) => void } = {},
): QueuedWriter<T> {
    let pending: Partial<T> | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let tail: Promise<void> = Promise.resolve()

    async function flush() {
        if (pending === null) return

        const patch = pending
        pending = null

        try {
            await write(patch)
        } catch (error) {
            onError(`Failed to save ${Object.keys(patch).join(', ')}:`, error)
        }
    }

    function schedule() {
        timer = undefined
        tail = tail.then(flush)
    }

    return {
        queue(patch) {
            pending = { ...pending, ...patch }

            clearTimeout(timer)
            timer = setTimeout(schedule, delayMs)
        },

        async settled() {
            if (timer !== undefined) {
                clearTimeout(timer)
                schedule()
            }

            // Each awaited tail can have grown another link behind it.
            let seen
            do {
                seen = tail
                await seen
            } while (seen !== tail)
        },
    }
}
