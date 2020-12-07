const _m = chrome.i18n.getMessage;

// var $groupExt = $('#groupExt');
// var $groupApp = $('#groupApp');
// var $groupTheme = $('#groupTheme');
// var $subtitleExt = $groupExt.find('.sub-title');
// var $subtitleApp = $groupApp.find('.sub-title');
// var $subtitleTheme = $groupTheme.find('.sub-title');
// var $listExt = $groupExt.find('.list');
// var $listApp = $groupApp.find('.list');
// var $listTheme = $groupTheme.find('.list');

// var getIcon = function (iconArray) {
//   var url;
//   iconArray.reverse().forEach(function (t) {
//     if (t.size > 16) {
//       url = t.url;
//     }
//   });
//   return url;
// }

// const appendList = result => {
//   $listExt.html('');
//   $listApp.html('');
//   $listTheme.html('');
//   $groupExt.removeClass('show');
//   $groupApp.removeClass('show');
//   $groupTheme.removeClass('show');

//   if (result) {
//     var extCount = 0;
//     var appCount = 0;
//     var themeCount = 0;
//     var extEnabledCount = 0;
//     var appEnabledCount = 0;

//     result.sort((a, b) => {
//       let nameA = a.name.toUpperCase(); // ignore upper and lowercase
//       let nameB = b.name.toUpperCase(); // ignore upper and lowercase

//       if ((a.enabled && b.enabled) || (!a.enabled && !b.enabled)) {
//         if (nameA < nameB) {
//           return -1;
//         }
//         return 1;
//       } else if (!a.enabled) {
//         return 1;
//       } else if (!b.enabled) {
//         return -1;
//       }

//       // names must be equal
//       return 0;
//     });

//     result.forEach(function (t, i) {
//       var id = t.id;
//       var name = t.name;
//       var description = t.description;
//       var type = t.type;
//       var enabled = t.enabled;
//       var mayDisabled = t.mayDisabled;
//       var homepageUrl = t.homepageUrl;
//       var icon;
//       var optionsUrl = t.optionsUrl;
//       var version = t.version;
//       var installType = t.installType;

//       if (t.icons) {
//         var icon = getIcon(t.icons);
//       }

//       var list = $('<li>').attr('id', id);

//       var listAction = $('<div>').addClass('list-action').prependTo(list);
//       if (optionsUrl) {
//         var iconOption = $('<a>').addClass('action-icon option').prependTo(listAction);

//         iconOption.click(function (e) {
//           e.preventDefault();
//           chrome.tabs.create({
//             url: optionsUrl
//           });
//         });
//       } else {
//         var iconplacehold = $('<a>').addClass('action-icon placehold').prependTo(listAction);
//       }

//       var iconDelete = $('<a>').addClass('action-icon delete').prependTo(listAction);

//       iconDelete.click(function (e) {
//         e.preventDefault();
//         chrome.management.uninstall(id);
//       });


//       var listLabel = $('<label>').addClass('control checkbox list-label').append($('<span class="control-indicator">')).prependTo(list);

//       var labelContent = $('<span>').addClass('label-content').html(name).attr('title', description).prependTo(listLabel);
//       var labelImg = $('<img>').addClass('label-img').attr('src', icon).prependTo(labelContent);

//       var checkbox = $('<input>').prop({
//         'checked': enabled,
//         'type': 'checkbox'
//       }).prependTo(listLabel);

//       if (!checkbox.prop('checked')) list.addClass('disabled');

//       checkbox.change(function () {
//         if ($(this).prop('checked')) {
//           chrome.management.setEnabled(id, true);
//           $('#' + id).removeClass('disabled');

//           if (type == 'extension') {
//             extEnabledCount++;
//           } else if (type != 'extension' && type != 'theme') {
//             appEnabledCount++;
//           }
//         } else {
//           chrome.management.setEnabled(id, false);
//           $('#' + id).addClass('disabled');

//           if (type == 'extension') {
//             extEnabledCount--;
//           } else if (type != 'extension' && type != 'theme') {
//             appEnabledCount--;
//           }
//         }

//         $('#countEnabledExt').text(extEnabledCount);
//         $('#countEnabledApp').text(appEnabledCount);
//       });

//       // If it is an extension instead of an application
//       if (type == 'extension') {
//         extCount++;
//         if (enabled) extEnabledCount++;
//         $groupExt.addClass('show');
//         $listExt.append(list);

//       } else if (type == 'theme') {
//         // Leave themes alone for now
//         themeCount++;
//       } else {
//         // If it is an app
//         appCount++;
//         if (enabled) appEnabledCount++;
//         $groupApp.addClass('show');

//         var iconOpen = $('<a>').addClass('action-icon open').appendTo(listAction);
//         iconOpen.click(function (e) {
//           e.preventDefault();
//           chrome.management.launchApp(id);
//         });

//         $listApp.append(list);
//       }

//       if (installType) {
//         list.addClass(installType);
//       }

//     });
//     $('#countEnabledExt').text(extEnabledCount);
//     $('#countEnabledApp').text(appEnabledCount);
//     $('#countExt').text(extCount);
//     $('#countApp').text(appCount);

//   }
// }

// let allExt;
// chrome.management.getAll(result => {
//   allExt = result;
//   appendList(result);
// });

// $('#search').keyup(e => {
//   console.log(e);
//   let value = e.target.value.toUpperCase();
//   let promise = new Promise(resolve => {
//     let search = [];
//     allExt.forEach((item, i) => {
//       if (item.name.toUpperCase().indexOf(value) > -1) {
//         search.push(item);
//       }
//     });
//     console.log(search);
//     resolve(search);
//   });

//   promise.then(appendList)
// });

// Event listner for clicks on links in a browser action popup.
// Open the link in a new tab of the current window.
const onAnchorClick = event => {
  chrome.tabs.create({
    selected: true,
    url: event.srcElement.href
  });
  return false;
}

// Given an array of URLs, build a DOM list of those URLs in the
// browser action popup.
const buildPopupDom = (divName, data) => {
  const popupDiv = document.getElementById(divName);
  const ul = document.createElement('ul');
  ul.classList.add('list');
  popupDiv.appendChild(ul);

  for (let i = 0, ie = data.length; i < ie; ++i) {
    let a = document.createElement('a');
    a.href = data[i].url;
    a.appendChild(document.createTextNode(data[i].title));
    a.addEventListener('click', onAnchorClick);
    let li = document.createElement('li');
    li.appendChild(a);
    ul.appendChild(li);
  }
}


// let savedResults = 10;

chrome.storage.sync.get({
  enabledSearch: true,
  // savedResults: 10,
  // currentTabs: [],
  // removedTabs: [],
}, props => {
  const searchBox = document.querySelector('#searchBox');
  props.enabledSearch ? searchBox.classList.remove('hidden') : searchBox.classList.add('hidden');
  // savedResults = props.savedResults

  // buildPopupDom('listRemoved', props.removedTabs);
  // buildPopupDom('listCurrent', props.currentTabs);
});

let removedTabs = localStorage.getItem('removedTabs');
let currentTabs = localStorage.getItem('currentTabs');

if (removedTabs !== null) {
  buildPopupDom('listRemoved', props.removedTabs);
}
if (currentTabs !== null) {
  buildPopupDom('listCurrent', props.currentTabs);
}

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log('message', message);
// })

// let currentTabs = []
// let tabsPromise;
// let historyPromise;

// tabsPromise = new Promise(resolve => {

//   chrome.tabs.query({
//     currentWindow: true
//   }, tabs => {
//     console.log('tabs', tabs)
//     tabs.forEach((tab, i) => {
//       currentTabs.push(tab)
//     });
//     resolve();
//   });

// });

// const getHistories = (filter, num) => {
//   let promise = new Promise((resolve, reject) => {
//     chrome.history.search(filter, histories => {return histories})
//   })
// }



// tabsPromise.then(() => {

//   historyPromise = new Promise(resolve => {
//     chrome.history.search({
//       text: '',
//       startTime: 0,
//       maxResults: savedResults,
//     }, items => {
//       console.log('history', items)
//       items.forEach((item, i) => {
//         if (item.url)
//       });
//     });
//   });

// })

// historyPromise.then(() => {

// });



// chrome.history.getVisits({
//   // text: '',
//   startTime: 0,
//   maxResults: savedResults,
// }, items => {
//   console.log('visits', items)
//   items.forEach((item, i) => {

//   });
// })

/* i18n */
// $('#titleExt').text(_m('extensions'));
// $('#titleApp').text(_m('applications'));
// $('#titleTheme').text(_m('themes'));