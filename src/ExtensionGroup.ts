interface Group {
    id: string;
    name?: string;
    extensions?: chrome.management.ExtensionInfo[] | [];
}

export enum SystemGroupIds {
    OTHERS = 'others',
    EXTENSION = 'extension',
    THEME = 'theme',
    APP = 'app',
}

/**
 * An extension group.
 */
export class ExtensionGroup implements Group {
    constructor(public id: string, public name: string | undefined = 'New Group', public extensions: chrome.management.ExtensionInfo[] | [] = []) {
        this.id = id;
        this.name = name;
        this.extensions = extensions;
    };

    get() {
        return {
            id: this.id,
            name: this.name,
            extensions: this.extensions,
        }
    }

    addToExtensions(extension: chrome.management.ExtensionInfo) {
        if (!this.extensions) {
            this.extensions = [];
        }
        this.extensions.push(extension as never);
        
        return this
    }
}