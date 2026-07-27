/** The ids the popup gives the groups it builds itself. */
export const SystemGroupIds = {
    OTHERS: 'others',
    EXTENSION: 'extension',
    THEME: 'theme',
    APP: 'app',
} as const

export type SystemGroupId = typeof SystemGroupIds[keyof typeof SystemGroupIds]

/** A titled list of extensions, as one section of the popup. */
export interface ExtensionGroup {
    id: string;
    name?: string;
    extensions: chrome.management.ExtensionInfo[];
}

/**
 * Groups keyed by id. A Map rather than an object because the keys are user data:
 * an id read from a backup file must not be able to reach `Object.prototype`.
 */
export type ExtensionGroups = Map<string, ExtensionGroup>
