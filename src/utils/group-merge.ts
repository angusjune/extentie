import { uuid } from '@/utils/uuid'

export type ImportMode = 'merge' | 'replace'

/**
 * Applies imported groups to the ones already set up.
 *
 * Extentie treats groups as a partition: every extension belongs to at most one
 * group, so an extension that is already grouped keeps its current group.
 */
export function applyImportedGroups(existing: UserGroupInfo[], imported: UserGroupInfo[], mode: ImportMode): UserGroupInfo[] {
    return mode === 'replace' ? replaceGroups(imported) : mergeGroups(existing, imported)
}

function replaceGroups(imported: UserGroupInfo[]): UserGroupInfo[] {
    const takenIds = new Set<string>()
    const takenExtensions = new Set<string>()

    return imported.map(group => {
        const id = takenIds.has(group.id) ? uuid() : group.id
        takenIds.add(id)

        const order = group.order.filter(extensionId => !takenExtensions.has(extensionId))
        order.forEach(extensionId => takenExtensions.add(extensionId))

        return { ...group, id, order }
    })
}

function mergeGroups(existing: UserGroupInfo[], imported: UserGroupInfo[]): UserGroupInfo[] {
    const takenIds = new Set(existing.map(group => group.id))
    const takenExtensions = new Set(existing.flatMap(group => group.order))

    // Extensions to append to a group that already exists, keyed by its id.
    const appended = new Map<string, string[]>()
    const added: UserGroupInfo[] = []

    for (const group of imported) {
        const newExtensions = group.order.filter(extensionId => !takenExtensions.has(extensionId))
        newExtensions.forEach(extensionId => takenExtensions.add(extensionId))

        const match = existing.find(candidate => hasSameName(candidate, group))

        if (match) {
            appended.set(match.id, [...(appended.get(match.id) ?? []), ...newExtensions])
            continue
        }

        const id = takenIds.has(group.id) ? uuid() : group.id
        takenIds.add(id)
        added.push({ ...group, id, order: newExtensions })
    }

    const updated = existing.map(group => {
        const extensions = appended.get(group.id)
        return extensions?.length ? { ...group, order: [...group.order, ...extensions] } : group
    })

    return [...updated, ...added]
}

function hasSameName(a: UserGroupInfo, b: UserGroupInfo): boolean {
    return (a.name ?? '').trim().toLowerCase() === (b.name ?? '').trim().toLowerCase()
}
