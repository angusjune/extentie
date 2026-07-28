/**
 * Which groups are folded up, stored as one option.
 *
 * The value is JSON text, but a profile that last synced before Chrome 2023 still
 * holds a plain array and there are no migrations to fix it — so reading has to
 * cope with both, and with a value that is neither.
 */

const idsIn = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []

export function parseCollapsedGroups(stored: unknown): string[] {
    if (typeof stored !== 'string') {
        return idsIn(stored)
    }

    try {
        return idsIn(JSON.parse(stored))
    } catch (error) {
        console.error('Stored collapsed groups are not valid JSON:', error)
        return []
    }
}

export function serializeCollapsedGroups(ids: string[]): string {
    return JSON.stringify(ids)
}

export function addCollapsedGroups(collapsed: string[], ids: string[]): string[] {
    return [...new Set([...collapsed, ...ids])]
}

export function removeCollapsedGroups(collapsed: string[], ids: string[]): string[] {
    const expanded = new Set(ids)
    return collapsed.filter(id => !expanded.has(id))
}
