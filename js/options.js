document.addEventListener('DOMContentLoaded', () => {
    const $searchCheckbox = $('#searchCheck');

    if (chrome.storage === null) {
        alert("Chrome storage not available");
        return;
    }

    chrome.storage.sync.get({
        enabledSearch: true
    }, props => {
        $searchCheckbox.prop('checked', props.enabledSearch)
    });

    $searchCheckbox.change(e => {
        console.log(e.target.checked);
        chrome.storage.sync.set({
            enabledSearch: e.target.checked
        })
    })
});