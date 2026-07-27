import { optionsStorage, userGroupsStorage } from './options-storage';
import { getIconDictionary, iconColors } from './action-icon';
import { msg } from '@/utils/i18n';

const optionsStored = {} as ExtentieOptions;
const localStored   = {} as { colorScheme: ColorScheme };

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
    let color: iconColors;

    if (iconColor === 'auto') {
        color = colorScheme === 'dark' ? iconColors.LIGHT : iconColors.DARK;
    } else {
        const key = iconColor.toUpperCase().replace(/-/g, '_');
        color = iconColors[key as keyof typeof iconColors];
    }

    const imageData = getIconDictionary(name, color);
    chrome.action.setIcon({ imageData })
}

// get all options
(async () => {
    const options = await optionsStorage.getAll();
    Object.assign(optionsStored, options);

    chrome.storage.local.get('colorScheme', ({ colorScheme }) => {
        Object.assign(localStored, { colorScheme });
        // set icon
        setIcon(options.iconStyle, options.iconColor, colorScheme);
    });

})();

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

chrome.storage.onChanged.addListener((changes, areaName) => {
    
    if (changes.options) {
        /** @ts-ignore */
        const newValues: ExtentieOptions = optionsStorage._decode(changes.options.newValue);
        Object.assign(optionsStored, newValues);
    } else if (changes.colorScheme) {
        localStored.colorScheme = changes.colorScheme.newValue;
    }

    setIcon(optionsStored.iconStyle, optionsStored.iconColor, localStored.colorScheme);
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