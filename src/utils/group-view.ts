import { SystemGroupIds, type ExtensionGroup, type ExtensionGroups } from '@/ExtensionGroup'

type Extension = chrome.management.ExtensionInfo

const byName = (a: Extension, b: Extension) => a.name.localeCompare(b.name)

const lower = (value: string) => value.toLowerCase()

/**
 * How to order the extensions within a group: alphabetically, or with the ones
 * that were enabled when the snapshot was taken first.
 */
export type GroupOrder = 'name' | ReadonlyMap<string, boolean>

function comparator(order: GroupOrder) {
    if (order === 'name') return byName

    return (a: Extension, b: Extension) =>
        Number(order.get(b.id) ?? false) - Number(order.get(a.id) ?? false) || byName(a, b)
}

/**
 * Extensions grouped by the kind of thing they are, titled by `titleOf`.
 *
 * `order` takes a snapshot rather than reading `enabled` live on purpose: the rows
 * settle when the list loads and stay put while the user toggles them, so one never
 * slides out from under the cursor mid-click.
 */
export function groupByType(
    extensions: Extension[],
    titleOf: (type: Extension['type']) => string,
    order: GroupOrder = 'name',
): ExtensionGroups {
    const groups: ExtensionGroups = new Map()

    for (const extension of extensions) {
        const title = titleOf(extension.type)
        const group = groups.get(title)

        if (group) group.extensions.push(extension)
        else groups.set(title, { id: title, name: title, extensions: [extension] })
    }

    for (const group of groups.values()) {
        group.extensions.sort(comparator(order))
    }

    return groups
}

/**
 * Extensions arranged into the groups the user set up, in the order they set them.
 *
 * Ids the user never chose are dropped: an extension listed in a group but no longer
 * installed leaves nothing behind.
 */
export function groupByUserGroups(extensions: Extension[], userGroups: UserGroupInfo[]): ExtensionGroups {
    const byId = new Map(extensions.map(extension => [extension.id, extension]))

    return new Map(userGroups.map(({ id, name, order }) => [id, {
        id,
        name: name || '',
        extensions: order.map(extensionId => byId.get(extensionId)).filter((e): e is Extension => e !== undefined),
    }]))
}

/**
 * The extensions no user group claims.
 */
export function ungrouped(extensions: Extension[], userGroups: UserGroupInfo[], name: string): ExtensionGroup {
    const claimed = new Set(userGroups.flatMap(group => group.order))

    return {
        id: SystemGroupIds.OTHERS,
        name,
        extensions: extensions.filter(extension => !claimed.has(extension.id)).sort(byName),
    }
}

/**
 * The groups holding an extension whose name matches, with the closest matches first.
 * A group with no match is left out entirely.
 */
export function searchGroups(term: string, groups: ExtensionGroups): ExtensionGroups {
    const needle = lower(term)
    const found: ExtensionGroups = new Map()

    for (const [id, group] of groups) {
        const extensions = group.extensions
            .filter(extension => lower(extension.name).includes(needle))
            .sort((a, b) => Number(lower(b.name).startsWith(needle)) - Number(lower(a.name).startsWith(needle)))

        if (extensions.length > 0) found.set(id, { ...group, extensions })
    }

    return found
}
