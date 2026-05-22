/**
 * Chrome's ExtensionInfo, augmented with `mayEnable` — a real Chrome API field
 * (present and `false` for disabled items the user is not allowed to enable)
 * that @types/chrome 0.0.287 omits.
 */
export type ExtensionInfo = chrome.management.ExtensionInfo & {
  readonly mayEnable?: boolean;
};

export type Category = 'extension' | 'app' | 'theme';

/** Classify an installed item into one of the three popup groups. */
export function categorize(ext: ExtensionInfo): Category {
  if (ext.type === 'theme') return 'theme';
  if (ext.isApp) return 'app';
  return 'extension';
}
