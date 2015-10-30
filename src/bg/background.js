// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });

var webstoreUrl  = 'https://chrome.google.com/webstore/category/extensions';
var extensionUrl = 'chrome://extensions/';

var mGotoWebStore  = chrome.i18n.getMessage('gotoWebStore');
var mGotoExtension = chrome.i18n.getMessage('gotoExtension');

chrome.contextMenus.create({
  "title": mGotoExtension,
  "contexts": ["browser_action"],
  "onclick": function(){
    chrome.tabs.create({ url: extensionUrl });
  }
});

chrome.contextMenus.create({
  "title": mGotoWebStore,
  "contexts": ["browser_action"],
  "onclick": function(){
    chrome.tabs.create({ url: webstoreUrl });
  }
});
