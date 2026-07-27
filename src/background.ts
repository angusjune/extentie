import { optionsStorage, userGroupsStorage } from './options-storage';
import { getIconDictionary, resolveIconColor } from './action-icon';
import { createQueuedWriter } from '@/utils/queued-writer';
import { msg } from '@/utils/i18n';

let optionsStored: ExtentieOptions | undefined;
const localStored   = {} as { colorScheme: ColorScheme };

// Nothing awaits a save, so these keep the writes in order, fold together the
// bursts a dragged slider or a typed-out name produce, and report a failure that
// would otherwise be an unhandled rejection.
const writeOptions    = createQueuedWriter(patch => optionsStorage.set(patch));
const writeUserGroups = createQueuedWriter(patch => userGroupsStorage.set(patch));

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

/**
 * Enables or disables an extension, and reports back the state it ended up in.
 *
 * An extension that Chrome disabled because it wants more permissions can only
 * be re-enabled through Chrome's own confirmation dialog. Asking for that dialog
 * from here is not safe: the user gesture is lost on the way to the service
 * worker, there is no window to own the dialog, and the popup that would own it
 * closes as soon as the dialog takes focus — which crashes the browser. Send the
 * user to Chrome's extensions page and let it run its own flow instead.
 */
async function setEnabled(id: string, enabled: boolean) {
    const extension = await chrome.management.get(id);

    if (enabled && extension.disabledReason === 'permissions_increase') {
        chrome.tabs.create({ url: `chrome://extensions/?id=${id}` });
        return { id, enabled: extension.enabled };
    }

    try {
        await chrome.management.setEnabled(id, enabled);
        return { id, enabled };
    } catch (error) {
        console.error(`Failed to ${enabled ? 'enable' : 'disable'} extension ${id}:`, error);
        return { id, enabled: extension.enabled };
    }
}

function setIcon(name: ExtentieOptions['iconStyle'], iconColor: ExtentieOptions['iconColor'], colorScheme: ColorScheme) {
    const imageData = getIconDictionary(name, resolveIconColor(iconColor, colorScheme));
    chrome.action.setIcon({ imageData })
}

/**
 * Loads what the toolbar icon is drawn from. A storage change can wake a cold
 * worker, and the listener would then run before this has finished — so the icon
 * is only ever drawn once there is something to draw it from.
 */
const loaded = (async () => {
    optionsStored = await optionsStorage.getAll();
    localStored.colorScheme = (await chrome.storage.local.get('colorScheme')).colorScheme;
})();

loaded.then(refreshIcon).catch(error => console.error('Failed to load options:', error));

function refreshIcon() {
    if (!optionsStored) return;

    setIcon(optionsStored.iconStyle, optionsStored.iconColor, localStored.colorScheme);
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
            writeOptions.queue(data);
            break;
        case "SET_USER_GROUPS":
            writeUserGroups.queue(data);
            break;
        case "SET_ENABLED":
            setEnabled(data.id, data.enabled).then(sendResponse);
            return true;
        case "UNINSTALL":
            chrome.management.uninstall(data.id, { showConfirmDialog: true }).then(() => {
                getExtensions().then(res => {
                    chrome.runtime.sendMessage(<Message>{ type: "EXT_CHANGED", data: res });
                })
            });
            break;
        case "SET_COLOR_SCHEME":
            chrome.storage.local.set({ colorScheme: data.colorScheme });
            break;
        default:
            break;
    }
});

chrome.storage.onChanged.addListener(async (changes) => {
    if (!changes.options && !changes.colorScheme) return;

    // A change can arrive before the bootstrap read above has finished.
    await loaded;

    if (changes.options) {
        /** @ts-ignore */
        optionsStored = optionsStorage._decode(changes.options.newValue) as ExtentieOptions;
    }

    if (changes.colorScheme) {
        localStored.colorScheme = changes.colorScheme.newValue;
    }

    refreshIcon();
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        contexts: ['action'],
        title: msg('set_up_user_groups'),
        id: 'customize'
    });
    chrome.contextMenus.create({
        contexts: ['action'],
        title: msg('manage_extensions'),
        id: 'manage'
    });
    chrome.contextMenus.create({
        contexts: ['action'],
        title: msg('go_to_webstore'),
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