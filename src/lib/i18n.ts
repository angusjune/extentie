/** Look up a localized message from _locales by key. */
export function t(key: string): string {
  return chrome.i18n.getMessage(key);
}
