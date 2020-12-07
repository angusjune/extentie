let maxTabs = 10;

chrome.runtime.onInstalled.addListener(() => {
  const localHistoryUrl = 'chrome://history/';
  const accountHistoryUrl = 'https://myactivity.google.com/';

  const mViewLocalHistory = chrome.i18n.getMessage('viewLocalHistory');
  const mViewAccountHistory = chrome.i18n.getMessage('viewAccountHistory');

  chrome.contextMenus.create({
    title: mViewLocalHistory,
    id: "viewLocalHistory",
    contexts: ["browser_action"],
  });

  chrome.contextMenus.create({
    title: mViewAccountHistory,
    id: "viewAccountHistory",
    contexts: ["browser_action"],
  });

  chrome.contextMenus.onClicked.addListener(info => {
    const id = info.menuItemId;
    let url;
    if (id === 'viewLocalHistory') {
      url = localHistoryUrl;
    } else if (id === 'viewAccountHistory') {
      url = accountHistoryUrl;
    }
    chrome.tabs.create({
      url: url
    });
  })
});

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

let currentWindowId;

if (chrome.runtime && chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    updateIcon();

    // Get current window ID
    chrome.tabs.getCurrent(tab => {
      currentWindowId = tab.windowId;
    });
  });
}

const updatePopup = (current, removed) => {
  localStorage.setItem("currentTabs", current);
  localStorage.setItem("removedTabs", removed);

  chrome.storage.sync.set({
    'currentTabs': current,
    'removedTabs': removed
  }, () => {
    // message('Settings saved');
  });
}



let currentTabs = [];
let removedTabs = localStorage.getItem('removedTabs') !== null ? localStorage.getItem('removedTabs') : [];

// Get all current tabs
const getCurrentTabs = () => {
  chrome.tabs.query({
    windowId: currentWindowId,
    url: '*://*/*'
  }, tabs => {
    tabs.forEach(tab => {
      currentTabs.unshift(tab)
    });
    updatePopup(currentTabs, removedTabs);
    console.log('current tabs', currentTabs);
  })
}

getCurrentTabs();

chrome.tabs.onCreated.addListener(tab => {
  currentTabs.unshift(tab);
  // getCurrentTabs();

  const createdTab = ele => tab.url === ele.url;
  const createdIndex = removedTabs.findIndex(createdTab);

  if (createdIndex > -1) {
    removedTabs.splice(createdIndex, 1);
  }

  updatePopup(currentTabs, removedTabs);
});

chrome.tabs.onRemoved.addListener((tabId, info) => {
  const removedTab = ele => tabId === ele.id;
  const removedIndex = currentTabs.findIndex(removedTab);
  console.log(currentTabs[removedIndex]);

  if (removedIndex > -1) {
    if (currentTabs[removedIndex].url.match(/^(http|https):\/\//gi)) {
      removedTabs.unshift(currentTabs[removedIndex]);

      if (removedTab.length > maxTabs) {
        removedTabs.pop();
      }
      console.log('removedTabs', removedTabs);
    }
    currentTabs.splice(removedIndex, 1);
    console.log('current tabs', currentTabs);
    updatePopup(currentTabs, removedTabs);
  }


});

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  // const tabId = tab.id || tab.sessionId;
  console.log('updated tabId', tabId);
  const updatedTab = ele => tabId === ele.id;
  const updatedIndex = currentTabs.findIndex(updatedTab);

  if (updatedIndex > -1) {
    currentTabs[updatedIndex] = tab;
    console.log('current tabs', currentTabs);
    updatePopup(currentTabs, removedTabs);
  }

  updateIcon();
});