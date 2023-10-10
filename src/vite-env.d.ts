/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare interface ExtentieOptions {
  enabledSearch: boolean;
  displayFullName: boolean;
  enabledExtensionsOnTop: boolean;
  showExtensionDescriptionOnHover: boolean;
  highlightSideLoadExtensions: boolean;
  layout: 'default' | 'compact' | 'comfortable',
  collapsed: string,
  showUserGroupsOnly: boolean,
  selectedTab: number,
  useNativeScrollbar: boolean,
  iconStyle: 'classic' | 'geometric' | 'modern',
  iconColor: 'auto' | 'light' | 'dark' | 'blue' | 'yellow',
}

declare interface UserGroupInfo {
	id: string,
	name?: string;
	order: chrome.management.ExtensionInfo['id'][] | [];
}

declare interface OptionsUserGroups {
	userGroups: UserGroupInfo[];
}

declare type ColorScheme = 'light' | 'dark';

declare interface Message {
  type: MessageType;
  data?: any;
}

declare enum MessageType {
  GET_ALL = 'GET_ALL',
  GET_EXTENSIONS = 'GET_EXT',
  GET_OPTIONS = 'GET_OPTIONS',
  SET_OPTIONS = 'SET_OPTIONS',
  GET_USER_GROUPS = 'GET_USER_GROUPS',
  SET_USER_GROUPS = 'SET_USER_GROUPS',
  UNINSTALL = 'UNINSTALL',
  EXT_CHANGED = 'EXT_CHANGED',
}

declare type ExtensionGroup = import('./ExtensionGroup').ExtensionGroup;

declare interface DefaultExtensionGroups {
  [key: string]: ExtensionGroup
}