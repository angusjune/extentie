import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: '__MSG_extName__',
  short_name: 'Extentie',
  description: '__MSG_extDesc__',
  version: pkg.version,
  default_locale: 'en',
  minimum_chrome_version: '88',
  icons: { '128': 'icons/icon-128.png' },
  action: {
    default_icon: {
      '16': 'icons/icon-16.png',
      '24': 'icons/icon-24.png',
      '32': 'icons/icon-32.png',
    },
    default_title: '__MSG_extDefaultTitle__',
    default_popup: 'src/popup/index.html',
  },
  options_ui: {
    page: 'src/options/index.html',
    open_in_tab: false,
  },
  permissions: ['management', 'storage'],
});
