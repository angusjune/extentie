import type { ExtensionInfo } from '../types';

/** List every installed extension, app, and theme. */
export function listExtensions(): Promise<ExtensionInfo[]> {
  return chrome.management.getAll();
}

/** Enable or disable an item. */
export function setEnabled(id: string, enabled: boolean): Promise<void> {
  return chrome.management.setEnabled(id, enabled);
}

/** Uninstall an item. Rejects if the user cancels the confirmation dialog. */
export function uninstall(id: string): Promise<void> {
  return chrome.management.uninstall(id);
}

/** Launch an installed app. */
export function launchApp(id: string): Promise<void> {
  return chrome.management.launchApp(id);
}

/** Open an item's options page in a new tab. */
export function openOptionsPage(url: string): Promise<chrome.tabs.Tab> {
  return chrome.tabs.create({ url });
}
