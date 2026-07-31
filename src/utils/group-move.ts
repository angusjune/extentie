/**
 * Moves extensions between user groups without mutating the groups it was given.
 *
 * `destinationGroupId` is null for Ungrouped, which is represented by an extension
 * appearing in no user group's order. Extensions already in the destination keep
 * their position; incoming extensions are appended in the order supplied.
 */
export function moveExtensionsToGroup(
    groups: UserGroupInfo[],
    extensionIds: Iterable<string>,
    destinationGroupId: string | null,
): UserGroupInfo[] {
    const selected = [...new Set(extensionIds)]

    if (selected.length === 0) return groups
    if (destinationGroupId !== null && !groups.some(group => group.id === destinationGroupId)) {
        return groups
    }

    const selectedSet = new Set(selected)
    const destination = destinationGroupId === null
        ? undefined
        : groups.find(group => group.id === destinationGroupId)
    const alreadyInDestination = new Set<string>()

    if (destination) {
        for (const id of destination.order) {
            if (selectedSet.has(id)) alreadyInDestination.add(id)
        }
    }

    let changed = false
    const moved = groups.map(group => {
        if (group.id === destinationGroupId) {
            const seenSelected = new Set<string>()
            const kept = group.order.filter(id => {
                if (!selectedSet.has(id)) return true
                if (seenSelected.has(id)) {
                    changed = true
                    return false
                }

                seenSelected.add(id)
                return true
            })
            const incoming = selected.filter(id => !alreadyInDestination.has(id))

            if (incoming.length === 0 && kept.length === group.order.length) return group

            changed = true
            return { ...group, order: [...kept, ...incoming] }
        }

        const order = group.order.filter(id => !selectedSet.has(id))
        if (order.length === group.order.length) return group

        changed = true
        return { ...group, order }
    })

    return changed ? moved : groups
}
