import OptionsSync from 'webext-options-sync';
import type { Options } from 'webext-options-sync';

type CustomOptions = ExtentieOptions & Options

export const optionsStorage = new OptionsSync<CustomOptions>({
	defaults: { 
		enabledSearch: true,
		displayFullName: false,
		enabledExtensionsOnTop: true,
		showExtensionDescriptionOnHover: false,
		highlightSideLoadExtensions: true,
		showEnableAllButton: true,
		popupHeight: 500,
		layout: 'default',
		collapsed: JSON.stringify(['others']),
		showUserGroupsOnly: false,
		selectedTab: 0,
		useNativeScrollbar: false,
		iconStyle: 'classic',
		iconColor: 'auto',
	},
	migrations: [
		(savedOptions, currentDefaults) => {},
		OptionsSync.migrations.removeUnused
	],
	logging: false,
});

export const userGroupsStorage = new OptionsSync({
	defaults: {
		userGroups: [],
	} as any,
	storageName: 'userGroups',
	migrations: [ OptionsSync.migrations.removeUnused, ],
	logging: false,
});