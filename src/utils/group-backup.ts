import { uuid } from '@/utils/uuid'
import { msg } from '@/utils/i18n'

/** Extentie's own backup format. */
export const BACKUP_FORMAT = 'extentie-groups'
export const BACKUP_VERSION = 1

export interface GroupBackup {
    format: string;
    version: number;
    exportedAt: string;
    groups: UserGroupInfo[];
    /** Informational only. Names are read from Chrome again on import. */
    extensionNames: Record<string, string>;
}

const MAX_NAME_LENGTH = 40
// Group ids end up as DOM ids on the set up page, so only accept plain ones.
const SAFE_ID = /^[A-Za-z0-9_-]+$/
const SIMPLE_EXT_MANAGER_KEY_PREFIX = /^GRP-/

/**
 * Turns the user groups into the JSON written to a backup file.
 */
export function serializeGroups(groups: UserGroupInfo[], extensions: chrome.management.ExtensionInfo[] = []): string {
    const names = new Map(extensions.map(extension => [extension.id, extension.name]))

    const backup: GroupBackup = {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        groups: groups.map(({ id, name, order }) => ({ id, name, order: [...order] })),
        extensionNames: Object.fromEntries(
            groups
                .flatMap(group => group.order)
                .filter(id => names.has(id))
                .map(id => [id, names.get(id)!])
        ),
    }

    return JSON.stringify(backup, null, 2) + '\n'
}

export function backupFilename(date: Date = new Date()): string {
    const [day] = date.toISOString().split('T')
    return `extentie-groups-${day}.json`
}

/**
 * Reads a backup file, either Extentie's own JSON or a SimpleExtManager one.
 * Throws with a reason when the file cannot be understood.
 */
export function parseGroupBackup(text: string): UserGroupInfo[] {
    const content = text.trim()

    if (!content) {
        throw new Error('Backup file is empty')
    }

    return content.startsWith('<') ? parseSimpleExtManagerBackup(content) : parseJsonBackup(content)
}

function parseJsonBackup(text: string): UserGroupInfo[] {
    let data: unknown

    try {
        data = JSON.parse(text)
    } catch (error) {
        console.error('Backup file is not valid JSON:', error)
        throw new Error('Backup file is not valid JSON')
    }

    const groups = Array.isArray(data) ? data : (data as Partial<GroupBackup> & Partial<OptionsUserGroups>)?.groups ?? (data as Partial<OptionsUserGroups>)?.userGroups

    if (!Array.isArray(groups)) {
        throw new Error('Backup file has no list of groups')
    }

    return groups.map(group => toUserGroup(group))
}

/**
 * SimpleExtManager stores its groups as `<ExtGrpBakV2><group><key/><val/></group>…</ExtGrpBakV2>`,
 * where each `val` holds a JSON group with its extension ids in `items`.
 */
function parseSimpleExtManagerBackup(text: string): UserGroupInfo[] {
    const doc = new DOMParser().parseFromString(text, 'application/xml')

    if (doc.querySelector('parsererror')) {
        throw new Error('Backup file is not valid XML')
    }

    return Array.from(doc.querySelectorAll('group')).map(node => {
        const key = node.querySelector('key')?.textContent ?? ''
        const value = node.querySelector('val')?.textContent ?? ''

        return toUserGroup(parseGroupEntry(value), key.replace(SIMPLE_EXT_MANAGER_KEY_PREFIX, ''))
    })
}

function parseGroupEntry(value: string): unknown {
    try {
        return JSON.parse(value)
    } catch (error) {
        console.error('Group entry in backup is not valid JSON:', error)
        throw new Error('Backup file contains a malformed group')
    }
}

function toUserGroup(raw: unknown, fallbackName = ''): UserGroupInfo {
    if (!raw || typeof raw !== 'object') {
        throw new Error('Backup file contains a group that is not an object')
    }

    const { id, name, order, items } = raw as Record<string, unknown>

    return {
        id: toGroupId(id),
        name: toGroupName(name ?? fallbackName),
        order: toExtensionIds(order ?? items),
    }
}

function toGroupId(id: unknown): string {
    return typeof id === 'string' && SAFE_ID.test(id) ? id : uuid()
}

function toGroupName(name: unknown): string {
    const trimmed = typeof name === 'string' ? name.trim() : ''
    return trimmed ? trimmed.slice(0, MAX_NAME_LENGTH) : msg('new_group')
}

function toExtensionIds(order: unknown): string[] {
    if (order === undefined || order === null) {
        return []
    }

    if (!Array.isArray(order)) {
        throw new Error('Backup file contains a group without a list of extensions')
    }

    const ids = order
        .filter((id): id is string => typeof id === 'string' && id.trim() !== '')
        .map(id => id.trim())

    return [...new Set(ids)]
}
