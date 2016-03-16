/**
 * Minimum age bound.
 * @const
 * @default
 * @type {Number}
 */
var MIN_AGE = 14;
/**
 * Maximum age bound.
 * @const
 * @default
 * @type {Number}
 */
var MAX_AGE = 80;

/**
 * Returns saved acceess token is it was saved, empty string otherwise.
 * @return {string} - Access token or empty string.
 */
function getAccessToken() {
    return localStorage.vkaccess_token || '';
}

/**
 * Returns number of people of every age.
 * @param {object} data - Information about users, generated with getFriendsInfo function.
 * @return {object} - Number of people of every age.
 */
function getFriendsAges(data) {
    var ages = {};
    var minAge = Math.max(localStorage.ageLowerbound || 0, MIN_AGE);
    var maxAge = Math.min(localStorage.ageUpperbound || 100, MAX_AGE);
    for (var i = 0; i < data.length; i++) {
        if ('bdate' in data[i]) {
            var currentAge = getAge(data[i].bdate);
            if (currentAge < minAge || currentAge > maxAge) {
                continue;
            }
            if (!(currentAge in ages)) {
                ages[currentAge] = [0, 0, 0];
            }
            ages[currentAge][data[i].sex]++;
        }
    }
    return ages;
}

/**
 * Returns number of people from every university.
 * @param {object} data - Information about users, generated with getFriendsInfo function.
 * @return {object} - Number of people from every university.
 */
function getFriendsUniversities(data) {
    var universities = {};
    for (var i = 0; i < data.length; i++) {
        if ('universities' in data[i]) {
            for (uind = 0; uind < data[i].universities.length; uind++) {
                universities[data[i].universities[uind].name] = (universities[data[i].universities[uind].name] | 0) + 1;
            }
        }
    }
    return universities;
}

/**
 * Returns number of people from every school.
 * @param {object} data - Information about users, generated with getFriendsInfo function.
 * @return {object} - Number of people from every school.
 */
function getFriendsSchools(data) {
    var schools = {};
    for (var i = 0; i < data.length; i++) {
        if ('schools' in data[i]) {
            for (sind = 0; sind < data[i].schools.length; sind++) {
                schools[data[i].schools[sind].name] = (schools[data[i].schools[sind].name] | 0) + 1;
            }
        }
    }
    return schools;
}

/**
 * Returns full data about friends.
 * @param {int} user_id - ID of use in vk.com.
 * @return {object} - Full data about all friends.
 */
function getFriendsInfo(user_id) {
    var access_token = getAccessToken();
    var url = 'https://api.vk.com/method/friends.get?user_id=' + user_id + '&fields=bdate,universities,schools,sex&access_token=' + access_token;
    var friends = sendRequest(url);
    if (!friends) {
        clearSession();
        friends = sendRequest(url);
    }
    var response = {
        ages: getFriendsAges(friends),
        universities: getFriendsUniversities(friends),
        schools: getFriendsSchools(friends)
    };
    return response;
}

/**
 * Returns information about current user (or empty object if user not logged in).
 * @return {object} - Full information about user or empty object if user is not logged in.
 */
function getCurrentUserInfo() {
    var access_token = getAccessToken();
    var url = 'https://api.vk.com/method/users.get?fields=first_name,last_name,id,photo_max&access_token=' + access_token;
    var tmpProfile = sendRequest(url);
    if (!tmpProfile) {
        clearSession();
        tmpProfile = sendRequest(url);
    }
    var profile = (typeof tmpProfile !== 'undefined') ? sendRequest(url)[0] || {} : {};
    return profile;
}

/**
 * Checks if page https://vk.com/<name> is user
 * @param {string} username - Username to check.
 * @return {object} - Information about user.
 */
function isUser(username) {
    var access_token = getAccessToken();
    var url = 'https://api.vk.com/method/users.get?user_ids=' + username + '&access_token=' + access_token;
    var resp = sendRequest(url);
    if (!resp) {
        clearSession();
        resp = sendRequest(url);
    }
    return resp;
}
