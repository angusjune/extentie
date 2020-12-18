/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/background.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/background.js":
/*!***************************!*\
  !*** ./src/background.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

const updateIcon = () => {
  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches; // OS set to dark mode
  const isIncognito = chrome.extension.inIncognitoContext; // Chrome is in incognito context
  if (isDarkMode || isIncognito) {
    // set light-colored icon in dark UI
    chrome.browserAction.setIcon({
      path: {
        '16': '/img/icon-light16.png',
        '32': '/img/icon-light32.png',
        '48': '/img/icon-light48.png',
        '128': '/img/icon-colored128.png'
      }
    });
    console.log('Dark UI activated', isDarkMode, isIncognito);
  } else {
    chrome.browserAction.setIcon({
      path: {
        '16': '/img/icon16.png',
        '32': '/img/icon32.png',
        '48': '/img/icon48.png',
        '128': '/img/icon-colored128.png'
      }
    });
  }
}

updateIcon();

if (chrome.runtime && chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(() => {
    updateIcon();
  });
}

chrome.tabs.onUpdated.addListener(updateIcon);

// chrome.runtime.onInstalled.addListener(() => {
//   const webstoreUrl = 'https://chrome.google.com/webstore/category/extensions';
//   const extensionUrl = 'chrome://extensions/';

//   chrome.contextMenus.create({
//     id: "gotoExtension",
//     title: chrome.i18n.getMessage('gotoExtension'),
//     contexts: ["browser_action"],
//     onclick: () => {
//       chrome.tabs.create({
//         url: extensionUrl
//       });
//     }
//   });

//   chrome.contextMenus.create({
//     id: "gotoWebStore",
//     title: chrome.i18n.getMessage('gotoWebStore'),
//     contexts: ["browser_action"],
//     onclick: () => {
//       chrome.tabs.create({
//         url: webstoreUrl
//       });
//     }
//   });
// });

/***/ })

/******/ });
//# sourceMappingURL=background.js.map