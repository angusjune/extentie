import type { ExtensionInfo } from '../types';

/** Pick a display icon URL: the smallest icon larger than 16px, else the largest available. */
export function pickIcon(icons: ExtensionInfo['icons']): string {
  if (!icons || icons.length === 0) return '';
  const sorted = [...icons].sort((a, b) => a.size - b.size);
  const aboveBaseline = sorted.find((icon) => icon.size > 16);
  return (aboveBaseline ?? sorted[sorted.length - 1]).url;
}
