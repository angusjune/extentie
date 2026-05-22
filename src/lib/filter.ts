import type { ExtensionInfo } from '../types';

/** Case-insensitive substring filter on name. An empty query returns every item. */
export function filterByName(items: ExtensionInfo[], query: string): ExtensionInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => item.name.toLowerCase().includes(q));
}
