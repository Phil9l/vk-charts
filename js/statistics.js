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

function getFriendsData(data, field, informationField) {
    var result = {};
    for (var i = 0; i < data.length; i++) {
        if (field in data[i]) {
            if (Array.isArray(data[i][field])) {
                for (itemInd = 0; itemInd < data[i][field].length; itemInd++) {
                    result[data[i][field][itemInd][informationField]] = (result[data[i][field][itemInd][informationField]] | 0) + 1;
                }
            } else {
                result[data[i][field]] = (result[data[i][field]] | 0) + 1;
            }
        }
    }
    return result;
}

/**
 * Returns number of people from every university.
 * @param {object} data - Information about users, generated with getFriendsInfo function.
 * @return {object} - Number of people from every university.
 */
function getFriendsUniversities(data) {
   return getFriendsData(data, 'universities', 'name');
}

/**
 * Returns number of people from every school.
 * @param {object} data - Information about users, generated with getFriendsInfo function.
 * @return {object} - Number of people from every school.
 */
function getFriendsSchools(data) {
    return getFriendsData(data, 'schools', 'name');
}

/**
 * Returns number of people from every city.
 * @param {object} data - Information about users, generated with getFriendsInfo function.
 * @return {object} - Number of people from every city.
 */
function getFriendsCities(data) {
    var cities = getFriendsData(data, 'city');
    var cityids = [];
    for (var city in cities) {
        cityids.push(city);
    }
    var citynames = sendAPIRequest('database.getCitiesById', {'city_ids': cityids.join(',')});
    var result = {};
    for (var cityInd in citynames) {
        result[citynames[cityInd].name] = cities[citynames[cityInd].cid];
    }
    return result;
}

/**
 * Returns full data about friends.
 * @param {int} user_id - ID of use in vk.com.
 * @return {object} - Full data about all friends.
 */
function getFriendsInfo(user_id) {
    var access_token = getAccessToken();
    var fields = 'bdate,universities,schools,sex,city';
    var friends = sendAPIRequest('friends.get', {'fields': fields, 'user_id': user_id, 'access_token': access_token});
    if (!friends) {
        clearSession();
        friends = sendAPIRequest('friends.get', {'fields': fields, 'user_id': user_id});
    }
    var response = {
        ages: getFriendsAges(friends),
        universities: getFriendsUniversities(friends),
        schools: getFriendsSchools(friends),
        cities: getFriendsCities(friends),
    };
    return response;
}

/**
 * Returns information about current user (or empty object if user not logged in).
 * @return {object} - Full information about user or empty object if user is not logged in.
 */
function getCurrentUserInfo() {
    var access_token = getAccessToken();
    var fields = 'first_name,last_name,id,photo_max';
    var tmpProfile = sendAPIRequest('users.get', {'fields': fields, 'access_token': access_token});
    var profile = (typeof tmpProfile !== 'undefined') ? tmpProfile[0] || {} : {};
    return profile;
}

/**
 * Checks if page https://vk.com/<name> is user
 * @param {string} username - Username to check.
 * @return {object} - Information about user.
 */
function isUser(username) {
    var access_token = getAccessToken();
    var resp = sendAPIRequest('users.get', {'user_ids': username, 'access_token': access_token});
    return resp || {};
}
