import { uuid } from '@/utils/uuid'
import { SystemGroupIds } from '@/ExtensionGroup'

// Group ids end up as DOM ids on the set up page, so only accept plain ones.
const SAFE_ID = /^[A-Za-z0-9_-]+$/

/**
 * Ids a user group may not take.
 *
 * A group id is used to look the group up, so anything `Object.prototype` already
 * answers to would resolve to the prototype instead of a group — and writing to it
 * would either corrupt every object in the page or throw. The popup also names the
 * groups it builds itself, and those names are not up for grabs either.
 */
const RESERVED = new Set<string>([
    ...Object.getOwnPropertyNames(Object.prototype),
    'prototype',
    ...Object.values(SystemGroupIds),
])

export function isUsableGroupId(id: unknown): id is string {
    return typeof id === 'string' && SAFE_ID.test(id) && !RESERVED.has(id)
}

/**
 * The id to store for a group, replacing one that cannot be used with a fresh id.
 */
export function toGroupId(id: unknown): string {
    return isUsableGroupId(id) ? id : uuid()
}

/**
 * Replaces stored ids that predate these rules. Returns the groups unchanged when
 * they all pass, so reading them does not look like an edit.
 */
export function sanitizeGroupIds(groups: UserGroupInfo[]): UserGroupInfo[] {
    if (groups.every(group => isUsableGroupId(group.id))) {
        return groups
    }

    return groups.map(group => (isUsableGroupId(group.id) ? group : { ...group, id: uuid() }))
}
