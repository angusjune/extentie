const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches; // OS set to dark mode
const isIncognito = chrome.extension.inIncognitoContext; // Chrome is in incognito context


if (isDarkMode || isIncognito) {
    // set light-colored icon in dark UI
    chrome.browserAction.setIcon({ path: `/icons/icon96-light.png`});
}

const webstoreUrl  = 'https://chrome.google.com/webstore/category/extensions';
const extensionUrl = 'chrome://extensions/';

const mGotoWebStore  = chrome.i18n.getMessage('gotoWebStore');
const mGotoExtension = chrome.i18n.getMessage('gotoExtension');

chrome.contextMenus.create({
  "title": mGotoExtension,
  "contexts": ["browser_action"],
  "onclick": () => {
    chrome.tabs.create({ url: extensionUrl });
  }
});

chrome.contextMenus.create({
  "title": mGotoWebStore,
  "contexts": ["browser_action"],
  "onclick": () => {
    chrome.tabs.create({ url: webstoreUrl });
  }
});
