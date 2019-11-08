const _m = chrome.i18n.getMessage;

var $groupExt   = $('#groupExt');
var $groupApp   = $('#groupApp');
var $groupTheme = $('#groupTheme');
var $subtitleExt   = $groupExt.find('.sub-title');
var $subtitleApp   = $groupApp.find('.sub-title');
var $subtitleTheme = $groupTheme.find('.sub-title');
var $listExt   = $groupExt.find('.list');
var $listApp   = $groupApp.find('.list');
var $listTheme = $groupTheme.find('.list');

var getIcon = function (iconArray) {
  var url;
  iconArray.reverse().forEach(function(t) {
    if (t.size > 16) {
      url = t.url;
    }
  });
  return url;
}

chrome.management.getAll(function(result){
  if (result) {
    var extCount = 0;
    var appCount = 0;
    var themeCount = 0;
    var extEnabledCount = 0;
    var appEnabledCount = 0;

    result.forEach(function(t, i) {
      var id = t.id;
      var name = t.name;
      var description = t.description;
      var type = t.type;
      var enabled = t.enabled;
      var mayDisabled = t.mayDisabled;
      var homepageUrl = t.homepageUrl;
      var icon;
      var optionsUrl = t.optionsUrl;
      var version = t.version;
      var installType = t.installType;

      if (t.icons) {
        var icon = getIcon(t.icons);
      }

      var list = $('<li>').attr('id', id);

      var listAction = $('<div>').addClass('list-action').prependTo(list);
      if (optionsUrl) {
        var iconOption = $('<a>').addClass('action-icon option').prependTo(listAction);

        iconOption.click(function(e) {
          e.preventDefault();
          chrome.tabs.create({url: optionsUrl});
        });
      } else {
        var iconplacehold = $('<a>').addClass('action-icon placehold').prependTo(listAction);
      }

      var iconDelete = $('<a>').addClass('action-icon delete').prependTo(listAction);

      iconDelete.click(function(e) {
        e.preventDefault();
        chrome.management.uninstall(id);
      });


      var listLabel  = $('<label>').addClass('control checkbox list-label').append($('<span class="control-indicator">')).prependTo(list);

      var labelContent = $('<span>').addClass('label-content').html(name).attr('title', description).prependTo(listLabel);
      var labelImg = $('<img>').addClass('label-img').attr('src', icon).prependTo(labelContent);

      var checkbox = $('<input>').prop({'checked': enabled, 'type': 'checkbox'}).prependTo(listLabel);

      if (!checkbox.prop('checked')) list.addClass('disabled');

      checkbox.change(function() {
        if ($(this).prop('checked')) {
          chrome.management.setEnabled(id, true);
          $('#' + id).removeClass('disabled');

          if (type == 'extension') {
            extEnabledCount++;
          } else if (type != 'extension' && type != 'theme') {
            appEnabledCount++;
          }
        } else {
          chrome.management.setEnabled(id, false);
          $('#' + id).addClass('disabled');

          if (type == 'extension') {
            extEnabledCount--;
          } else if (type != 'extension' && type != 'theme') {
            appEnabledCount--;
          }
        }

        $('#countEnabledExt').text(extEnabledCount);
        $('#countEnabledApp').text(appEnabledCount);
      });

      // If it is an extension instead of an application
      if (type == 'extension') {
        extCount++;
        if (enabled) extEnabledCount++;
        $groupExt.addClass('show');
        $listExt.append(list);

      } else if (type == 'theme') {
        // Leave themes alone for now
        themeCount++;
      } else {
        // If it is an app
        appCount++;
        if (enabled) appEnabledCount++;
        $groupApp.addClass('show');

        var iconOpen = $('<a>').addClass('action-icon open').appendTo(listAction);
        iconOpen.click(function(e) {
          e.preventDefault();
          chrome.management.launchApp(id);
        });

        $listApp.append(list);
      }

      if (installType) {
        list.addClass(installType);
      }

    });
    $('#countEnabledExt').text(extEnabledCount);
    $('#countEnabledApp').text(appEnabledCount);
    $('#countExt').text(extCount);
    $('#countApp').text(appCount);

  }
});

/* i18n */
$('#titleExt').text(_m('extensions'));
$('#titleApp').text(_m('applications'));
$('#titleTheme').text(_m('themes'));
