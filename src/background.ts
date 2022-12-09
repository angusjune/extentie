import { optionsStorage, userGroupsStorage } from './options-storage';

const i18n = chrome.i18n.getMessage;

async function getAll() {
    const extensions: chrome.management.ExtensionInfo[] = await chrome.management.getAll();
    const options    = await optionsStorage.getAll();
    const userGroups = await userGroupsStorage.getAll();

    return { extensions, options, userGroups };
}

async function getExtensions() {
    const extensions = await chrome.management.getAll();
    return extensions;
}

async function getOptions() {
    const options = await optionsStorage.getAll();
    return options;
}

chrome.runtime.onMessage.addListener(({ type, data }: Message, sender, sendResponse) => {
    switch (type) {
        case "GET_ALL":
            getAll().then(sendResponse);
            return true;
        case "GET_EXT":
            getExtensions().then(sendResponse);
            return true;
        case "GET_OPTIONS":
            getOptions().then(sendResponse);
            return true;
        case "SET_OPTIONS":
            optionsStorage.set(data);
            break;
        case "SET_USER_GROUPS":
            userGroupsStorage.set(data);
            break;
        case "UNINSTALL":
            chrome.management.uninstall(data.id, { showConfirmDialog: true }).then(() => {
                getExtensions().then(res => {
                    chrome.runtime.sendMessage(<Message>{ type: "EXT_CHANGED", data: res });
                })
            });
            break;
        default:
            break;
    }
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        contexts: ['action'],
        title: i18n('set_groups'),
        id: 'customize'
    });
    chrome.contextMenus.create({
        contexts: ['action'],
        title: i18n('manage_extensions'),
        id: 'manage'
    });
    chrome.contextMenus.create({
        contexts: ['action'],
        title: i18n('go_to_webstore'),
        id: 'webstore'
    });
});

chrome.contextMenus.onClicked.addListener(({ menuItemId }) => {
    switch(menuItemId) {
        case 'customize':
            chrome.tabs.create({ url: chrome.runtime.getURL('customize.html') });
            break;
        case 'manage':
            chrome.tabs.create({ url: 'chrome://extensions/' });
            break;
        case 'webstore':
            chrome.tabs.create({ url: 'https://chrome.google.com/webstore/category/extensions' });
            break;
        default:
            break;
    }
});