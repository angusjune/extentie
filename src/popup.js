'use strict';

import './popup.scss';
import './extList';

const $ = (queryString = '') => { return document.querySelector(queryString); };

const $groupExt   = $('#groupExt');
const $groupApp   = $('#groupApp');
const $groupTheme = $('#groupTheme');
const $listExt    = $groupExt.querySelector('.list');
const $listApp    = $groupApp.querySelector('.list');
const $listTheme  = $groupTheme.querySelector('.list');

const isBrowserDark = window.matchMedia('(prefers-color-scheme: dark)').matches || chrome.extension.inIncognitoContext;
chrome.runtime.sendMessage({ isBrowserDark: isBrowserDark });
if (isBrowserDark) {
      chrome.action.setIcon({ 
        path: {
          16: `icons/icon-light-16.png`,
          24: `icons/icon-light-24.png`,
          32: `icons/icon-light-32.png`,
        }
      });
    } else {
      chrome.action.setIcon({ path: {
        16: `icons/icon-16.png`,
        24: `icons/icon-24.png`,
        32: `icons/icon-32.png`,
      }});
}

const getIcon = iconArray => {
  let url;
  iconArray.reverse().forEach(t => {
    if (t.size > 16) {
      url = t.url;
    }
  });
  return url;
};

const appendList = result => {
  $listExt.innerHTML   = '';
  $listApp.innerHTML   = '';
  $listTheme.innerHTML = '';
  $groupExt.classList.remove('show');
  $groupApp.classList.remove('show');
  $groupTheme.classList.remove('show');

  if (result) {
    let extCount   = 0;
    let appCount   = 0;
    let themeCount = 0;
    let extEnabledCount   = 0;
    let appEnabledCount   = 0;
    let themeEnabledCount = 0;

    result.sort((a, b) => {
      const nameA = a.name.toUpperCase(); // ignore upper and lowercase
      const nameB = b.name.toUpperCase(); // ignore upper and lowercase

      if ((a.enabled && b.enabled) || (!a.enabled && !b.enabled)) {
        if (nameA < nameB) {
          return -1;
        }
        return 1;
      } else if (!a.enabled) {
        return 1;
      } else if (!b.enabled) {
        return -1;
      }

      // names must be equal
      return 0;
    });

    result.forEach(t => {
      const id          = t.id;
      const name        = t.name;
      const shortName   = t.shortName;
      const description = t.description;
      const type        = t.type;
      const isApp       = t.isApp;
      const enabled     = t.enabled;
      const icon        = t.icons ? getIcon(t.icons) : '';
      const optionsUrl  = t.optionsUrl;
      const installType = t.installType;
      const mayEnabled  = t.mayEnabled;
      const mayDisabled = t.mayDisable;

      const list = document.createElement('ext-list');
      list.textContent = shortName || name;

      list.setAttribute('id', id);
      list.setAttribute('iconurl', icon);
      list.setAttribute('installtype', installType);
      list.setAttribute('mayenabled', mayEnabled);
      list.setAttribute('maydisabled', mayDisabled);
      list.setAttribute('role', 'listitem');

      if (enabled) list.setAttribute('enabled', '');
      if (isApp) list.setAttribute('isapp', '');
      if (optionsUrl) list.setAttribute('optionsurl', optionsUrl);

      list.addEventListener('checkbox:change', e => {
        const enabled = e.detail.target.checked;
        chrome.management.setEnabled(id, enabled);

        if (enabled) {
          list.setAttribute('enabled', '');

          if (type === 'extension') {
            extEnabledCount++;
          } else if (type === 'theme') {
            themeEnabledCount++;
          } else if (isApp) {
            appEnabledCount++;
          }

        } else {
          list.removeAttribute('enabled');

          if (type === 'extension') {
            extEnabledCount--;
          } else if (type === 'theme') {
            themeEnabledCount--;
          } else if (isApp) {
            appEnabledCount--;
          }
        }

        $('#countEnabledExt').textContent = extEnabledCount;
        $('#countEnabledApp').textContent = appEnabledCount;
        $('#countEnabledTheme').textContent = themeEnabledCount;
      });

      list.addEventListener('action:click', e => {
        if (e.detail.type === 'DELETE') {
          chrome.management.uninstall(id);
        } else if (e.detail.type === 'OPEN_OPTIONS') {
          chrome.tabs.create({ url: optionsUrl });
        } else if (e.detail.type === 'LAUNCH_APP') {
          chrome.management.launchApp(id);
        }
      });

      // If it is an extension instead of an application
      if (type == 'extension') {
        extCount++;
        if (enabled) extEnabledCount++;
        $groupExt.classList.add('show');
        $listExt.appendChild(list);
      } else if (type == 'theme') {
        // If it is theme
        themeCount++;
        if (enabled) themeEnabledCount++;
        $groupTheme.classList.add('show');
        $listTheme.appendChild(list);
      } else if (isApp) {
        // If it is an app
        appCount++;
        if (enabled) appEnabledCount++;
        $groupApp.classList.add('show');
        $listApp.appendChild(list);
      }

    });

    $('#countEnabledExt').textContent = extEnabledCount;
    $('#countEnabledApp').textContent = appEnabledCount;

    $('#countExt').textContent   = extCount;
    $('#countApp').textContent   = appCount;
    $('#countTheme').textContent = themeCount;
  }
};

let allExtensions;
chrome.management.getAll(result => {
  allExtensions = result;
  appendList(result);
});

// search
$('#inputSearch').addEventListener('input', e => {
  const value = e.target.value.toUpperCase();
  const promise = new Promise(resolve => {
    let search = [];
    allExtensions.forEach((item, i) => {
      if (item.name.toUpperCase().indexOf(value) > -1) {
        search.push(item);
      }
    });
    resolve(search);
  });

  promise.then(appendList);
});

chrome.storage.sync.get({
  enabledSearch: true
}, result => {
  if (!result.enabledSearch) $('body').classList.add('hide-search');
});

/* i18n */
document.querySelectorAll('[data-msg]').forEach(el => {
  el.textContent = chrome.i18n.getMessage(el.dataset.msg);
});