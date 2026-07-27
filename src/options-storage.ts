import OptionsSync from 'webext-options-sync';
import type { Options } from 'webext-options-sync';

type CustomOptions = ExtentieOptions & Options

// Keep migrations out of these long-lived instances. OptionsSync gates getAll()
// on install detection when migrations are present, delaying every cold worker wake.
export const optionsStorage = new OptionsSync<CustomOptions>({
	defaults: { 
		enabledSearch: true,
		showSettingsButton: true,
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
		iconStyle: 'geometric',
		iconColor: 'auto',
	},
	logging: false,
});

export const userGroupsStorage = new OptionsSync({
	defaults: {
		userGroups: [],
	} as any,
	storageName: 'userGroups',
	logging: false,
});
