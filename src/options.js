import './options.scss';

const checkboxSearch = document.querySelector('#searchCheck');

chrome.storage.sync.get({
    enabledSearch: true
}, result => {
    checkboxSearch.checked = result.enabledSearch;
});

checkboxSearch.addEventListener('change', e => {
    chrome.storage.sync.set({
        enabledSearch: e.target.checked
    });
});