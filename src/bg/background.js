const updateIcon = () => {
  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches; // OS set to dark mode
  const isIncognito = chrome.extension.inIncognitoContext; // Chrome is in incognito context
  if (isDarkMode || isIncognito) {
    // set light-colored icon in dark UI
    chrome.browserAction.setIcon({
      path: {
        '16': '/img/icon-light16.png',
        '32': '/img/icon-light32.png',
        '48': '/img/icon-light48.png',
        '128': '/img/icon-colored128.png'
      }
    });
    console.log('Dark UI activated', isDarkMode, isIncognito);
  } else {
    chrome.browserAction.setIcon({
      path: {
        '16': '/img/icon16.png',
        '32': '/img/icon32.png',
        '48': '/img/icon48.png',
        '128': '/img/icon-colored128.png'
      }
    });
  }
}

updateIcon();

if (chrome.runtime && chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    updateIcon();
  });
}

chrome.tabs.onUpdated.addListener(updateIcon);

chrome.runtime.onInstalled.addListener(() => {
  const webstoreUrl = 'https://chrome.google.com/webstore/category/extensions';
  const extensionUrl = 'chrome://extensions/';

  const mGotoWebStore = chrome.i18n.getMessage('gotoWebStore');
  const mGotoExtension = chrome.i18n.getMessage('gotoExtension');

  chrome.contextMenus.create({
    "title": mGotoExtension,
    "contexts": ["browser_action"],
    "onclick": () => {
      chrome.tabs.create({
        url: extensionUrl
      });
    }
  });

  chrome.contextMenus.create({
    "title": mGotoWebStore,
    "contexts": ["browser_action"],
    "onclick": () => {
      chrome.tabs.create({
        url: webstoreUrl
      });
    }
  });
});