import OptionsSync from 'webext-options-sync';

const defaultOptions: Options = {
	enabledSearch: true,
	displayFullName: false,
	enabledExtensionsOnTop: true,
	showExtensionDescriptionOnHover: false,
	layout: 'default',
	collapsed: ['others'],
	showUserGroupsOnly: false,
	selectedTab: 0,
	useNativeScrollbar: false,
}

export const optionsStorage = new OptionsSync({
	/** @ts-ignore */
	defaults: { ...defaultOptions },
	migrations: [
		(savedOptions, currentDefaults) => {},
		OptionsSync.migrations.removeUnused
	]
});

const defaultUserGroups: OptionsUserGroups = {
	userGroups: [],
}

export const userGroupsStorage = new OptionsSync({
	defaults: defaultUserGroups as any,
	storageName: 'userGroups',
	migrations: [ OptionsSync.migrations.removeUnused, ]
});

const defaultThemes: OptionsThemes = {
    icon: 'light'
}

export const themesStorage = new OptionsSync({
    defaults: { ...defaultThemes },
    storageName: 'themes',
    storageType: 'local',
	migrations: [ OptionsSync.migrations.removeUnused, ],
    logging: false,
});