export type ExtensionInfo = chrome.management.ExtensionInfo;

export type Category = 'extension' | 'app' | 'theme';

/** Classify an installed item into one of the three popup groups. */
export function categorize(ext: ExtensionInfo): Category {
  if (ext.type === 'theme') return 'theme';
  if (ext.isApp) return 'app';
  return 'extension';
}
