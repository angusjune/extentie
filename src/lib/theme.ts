/** Detect dark mode (including incognito) and switch the toolbar action icon. */
export function applyTheme(): void {
  const dark =
    window.matchMedia('(prefers-color-scheme: dark)').matches ||
    chrome.extension.inIncognitoContext;
  const prefix = dark ? 'icon-light' : 'icon';
  chrome.action.setIcon({
    path: {
      16: `icons/${prefix}-16.png`,
      24: `icons/${prefix}-24.png`,
      32: `icons/${prefix}-32.png`,
    },
  });
}
