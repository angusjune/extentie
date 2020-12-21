const updateIcon = () => {
  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches; // OS set to dark mode
  const isIncognito = chrome.extension.inIncognitoContext; // Chrome is in incognito context
  if (isDarkMode || isIncognito) {
    // set light-colored icon in dark UI
    chrome.browserAction.setIcon({
      path: {
        '32': 'chrome-extension://__MSG_@@extension_id__/icons/icon-light-32.png',
      }
    });
  } else {
    chrome.browserAction.setIcon({
      path: {
        '32': 'chrome-extension://__MSG_@@extension_id__/icons/icon--32.png',
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

// chrome.runtime.onInstalled.addListener(() => {
//   const webstoreUrl = 'https://chrome.google.com/webstore/category/extensions';
//   const extensionUrl = 'chrome://extensions/';

//   chrome.contextMenus.create({
//     id: "gotoExtension",
//     title: chrome.i18n.getMessage('gotoExtension'),
//     contexts: ["browser_action"],
//     onclick: () => {
//       chrome.tabs.create({
//         url: extensionUrl
//       });
//     }
//   });

//   chrome.contextMenus.create({
//     id: "gotoWebStore",
//     title: chrome.i18n.getMessage('gotoWebStore'),
//     contexts: ["browser_action"],
//     onclick: () => {
//       chrome.tabs.create({
//         url: webstoreUrl
//       });
//     }
//   });
// });