/**
 * Gets object by parsing json in given url.
 * @param  {string} url JSON url.
 * @return {object}     Parsed JSON.
 */

/**
 * Gets object by parsing json in given url.
 * @param {string} url - JSON url.
 * @return {object} - Parsed JSON.
 */
function sendRequest(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    var result = null;
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if ('response' in JSON.parse(xhr.responseText)) {
                result = JSON.parse(xhr.responseText).response;
            }
        }
    };
    xhr.send();
    return result;
}

function buildURL(url, params) {
    for (var item in params) {
        url += item + '=' + params[item] + '&';
    }
    return url;
}

function sendAPIRequest(method, params, maxnumber) {
    var url = buildURL('https://api.vk.com/method/' + method + '?', params);
    var resp = sendRequest(url);
    if (resp === null) {
        clearSession();
        delete params.access_token;
        url = buildURL('https://api.vk.com/method/' + method + '?', params);
        resp = sendRequest(url);
    }
    return resp;
}

/**
 * Gets age by date of birth.
 * @param {date} bdate - Date of birth.
 * @return {int} - Age of person born in bdate.
 */
function getAge(bdate) {
    var datefields = bdate.split('.');
    if (bdate.length < 3) {
        return 0;
    }
    var birthday = new Date(datefields[2], datefields[1] - 1, datefields[0]);
    var ageDifMs = Date.now() - birthday.getTime();
    var ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}

/**
 * Returns value by key from url (e.g. http://domain.com/index.php#key1=val1&key2=val2&key3=val3).
 * @param {string} url - Url to parse.
 * @param {string} key - Key to extract value from url.
 * @return {string} - Value by given key in url (or undefined if no key in url).
 */
function getUrlParameterValue(url, key) {
    var params  = url.substr(url.indexOf("#") + 1).split("&");
    for (var index = 0; index < params.length; index += 1) {
        var param = params[index].split("=");
        if (param[0] === key) {
            return param[1];
        }
    }
    return undefined;
}

/** Deletes Access Token from local storage. */
function clearSession() {
    localStorage.vkaccess_token = '';
}

/** Saves vkontakte API key into the local strorage. */
function getToken() {
    var client_id = 5300315;
    var authUrl = 'https://oauth.vk.com/authorize?client_id=' + client_id + '&scope=users,offline&redirect_uri=http%3A%2F%2Foauth.vk.com%2Fblank.html&display=page&response_type=token';
    chrome.tabs.create({url: authUrl,selected: true}, function(tab) {
        authTabId = tab.id;
        chrome.tabs.onUpdated.addListener(function tabUpdateListener(tabId, changeInfo) {
            if(tabId === authTabId && typeof changeInfo.url != 'undefined' && changeInfo.status === "loading") {
                if (changeInfo.url.indexOf('oauth.vk.com/blank.html') > -1 )  {
                    chrome.tabs.onUpdated.removeListener(tabUpdateListener);
                    vkAccessToken = getUrlParameterValue(changeInfo.url, 'access_token');
                    localStorage.vkaccess_token = vkAccessToken;
                    chrome.tabs.remove(tabId, function(tab){});
                }
            }
        });
    });
}

/** Changing age bounds. */
function changeAgeBounds(lowerbound, upperbound) {
    localStorage.ageLowerbound = +lowerbound;
    localStorage.ageUpperbound = +upperbound;
}

/** Change default chart state. */
function changeDefaultState(stateIndex) {
    localStorage.stateIndex = +stateIndex;
}

/** Returns default chart state. */
function getDefaultState() {
    return (localStorage.stateIndex - 0 == localStorage.stateIndex) ? localStorage.stateIndex : 0;
}

/** Handles data from client. */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    var responsingFunctions = {
        'isUser': {
            'function': isUser,
            'params': ['user'],
        },
        'getCurrentUserInfo': {
            'function': getCurrentUserInfo,
            'params': [],
        },
        'logout': {
            'function': clearSession,
            'params': [],
        },
        'auth': {
            'function': getToken,
            'params': [],
        },
        'getFriendsInfo': {
            'function': getFriendsInfo,
            'params': ['user'],
        },
        'changeAgeBounds': {
            'function': changeAgeBounds,
            'params': ['lowerbound', 'upperbound'],
        },
        'changeDefaultState': {
            'function': changeDefaultState,
            'params': ['stateIndex'],
        },
        'getDefaultState': {
            'function': getDefaultState,
            'params': [],
        },
    };
    if (!(request.method in responsingFunctions)) {
        sendResponse({});
        return;
    }
    var func = responsingFunctions[request.method].function;
    var params_list = responsingFunctions[request.method].params;
    var params = [];
    for (var i = 0; i < params_list.length; i++) {
        if (!(params_list[i] in request)) {
            sendResponse({});
            return;
        }
        params.push(request[params_list[i]]);
    }
    var result = func.apply(this, params);
    sendResponse(typeof result !== 'undefined' ? result : {});
});

/** Opening settings on icon click. */
chrome.browserAction.onClicked.addListener(function(activeTab) {
    chrome.tabs.create({ url: "pages/information.html" });
});
