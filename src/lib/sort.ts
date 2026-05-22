import type { ExtensionInfo } from '../types';

/** Sort enabled items first, then by case-insensitive name. Returns a new array. */
export function sortExtensions(items: ExtensionInfo[]): ExtensionInfo[] {
  return [...items].sort((a, b) => {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}
