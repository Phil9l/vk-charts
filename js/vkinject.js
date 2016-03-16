var MAX_LEGEND_STRING_LENGTH = 26;
var MAX_LEGEND_ITEMS_NUMBER = 18;
var UPDATE_TIMEOUT = 100;

/**
 * Pads string with zeroes upto given length.
 * @param {string} num - Given number to pad.
 * @param {int} size - Length of final string.
 * @return {string} - String padded with zeroes upto given length.
 */
function pad(num, size) {
    var s = num + '';
    while (s.length < size) {
        s = '0' + s;
    }
    return s;
}

/**
 * Returns random integer number in interval [0, bound).
 * @param {int} bound - Upperbound of random number.
 * @return {int} - Random number in given bounds.
 */
function getRandom(bound) {
  return Math.floor(Math.random() * bound);
}

/** Returns random color. */
function generateRandomColor(redMix, greenMix, blueMix) {
    var red = Math.round((redMix + getRandom(256)) / 2).toString(16);
    var green = Math.round((greenMix + getRandom(256)) / 2).toString(16);
    var blue = Math.round((blueMix + getRandom(256)) / 2).toString(16);
    var res = [];
    res.push('#' + pad(red, 2) + pad(green, 2) + pad(blue, 2));
    return res;
}

function sortObject(obj, size) {
    var sortable = [];
    for (var item in obj) {
        sortable.push([item, obj[item]]);
    }
    if (sortable.length > size) {
        sortable.sort(function(a, b) {return b[1] - a[1];});
        var other = sortable.length - size + 1;
        sortable = sortable.slice(0, size - 1);
        sortable.push(["Остальные", other]);
    }
    sortable.sort(function(a, b) {return b[1] - a[1];});
    var resp = {};
    for (var i = 0; i < sortable.length; i++) {
        resp[sortable[i][0]] = sortable[i][1];
    }
    return resp;
}

function addOption(selector, key, value, selected) {
    $(selector).append(
        $("<option" + (selected ? " selected" : "") + "></option>").attr("value", key).text(value)
    );
}

function addAgeStatistic(response) {
    var ctx = $("#friend-age-chart").get(0).getContext("2d");
    var data = {
        labels: [],
        datasets: [
            {
                label: "Неизвестно",
                fillColor: "rgba(220,220,220,0.2)",
                strokeColor: "rgba(220,220,220,1)",
                pointColor: "rgba(220,220,220,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data: []
            }, {
                label: "Женщины",
                fillColor: "rgba(255,182,193,0.6)",
                strokeColor: "rgba(255,182,193,1)",
                pointColor: "rgba(255,182,193,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(255,182,193,1)",
                data: []
            }, {
                label: "Мужчины",
                fillColor: "rgba(217,233,255,0.6)",
                strokeColor: "rgba(217,233,255,1)",
                pointColor: "rgba(217,233,255,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(217,233,255,1)",
                data: []
            },
        ]
    };
    for (var age in response) {
        if (age && !isNaN(age)) {
            data.labels.push(age);
            for (var gender = 0; gender < 3; gender++) {
                data.datasets[gender].data.push(response[age][gender]);
            }
        }
    }
    var myLineChart = new Chart(ctx).StackedBar(data, {
        yAxisMinimumInterval : 1,
    });
}

function fmtChartJSPerso(config, value, fmt){
    if (fmt === "Cutting") {
        return value.length <= MAX_LEGEND_STRING_LENGTH ? value : value.substring(0, MAX_LEGEND_STRING_LENGTH - 3) + '...';
    }
    return value;
}

function addUniversityStatistic(response) {
    var ctx = $("#friend-university-chart").get(0).getContext("2d");
    response = sortObject(response, MAX_LEGEND_ITEMS_NUMBER);
    var data = [];

    for (var university in response) {
        data.push({
            label: university,
            value: response[university],
            color: generateRandomColor(255, 255, 255)
        });
    }
    var myLineChart = new Chart(ctx).Pie(data, {
        legend: true,
        annotateDisplay: true,
        highLight: true,
        fmtLegend : "Cutting",
        maxLegendCols: 2,
    });
}

function addSchoolStatistic(response) {
    var ctx = $("#friend-school-chart").get(0).getContext("2d");
    response = sortObject(response, MAX_LEGEND_ITEMS_NUMBER);
    var data = [];

    for (var school in response) {
        data.push({
            label: school,
            value: response[school],
            color: generateRandomColor(255, 255, 255)
        });
    }
    var myLineChart = new Chart(ctx).Pie(data, {
        legend: true,
        annotateDisplay: true,
        highLight: true,
        fmtLegend : "Cutting",
        maxLegendCols: 2,
    });
}

function renderCharts() {
    var user = document.location.pathname.slice(1);
    chrome.runtime.sendMessage({method: "isUser", user: user}, function(user_response) {
        if (!$.isEmptyObject(user_response)) {
            $('#profile_short').before('<div class="friend-statistic-container"></div>');
            $('.friend-statistic-container').append('<div class="friends-select"><select id="friends-select-list"></select></div>');

            chrome.runtime.sendMessage({method: "getDefaultState"}, function(stateIndex) {
                addOption("#friends-select-list", "age", "Статистика возрастов", +stateIndex === 0);
                addOption("#friends-select-list", "universities", "Статистика университетов", +stateIndex === 1);
                addOption("#friends-select-list", "schools", "Статистика школ", +stateIndex === 2);
                addOption("#friends-select-list", "empty", "Скрыть", +stateIndex === 3);

                $('.friend-statistic-container').append('<div statistic-type="age" class="friend-age-statistic friend-statistic"><canvas id="friend-age-chart" width="400" height="250"></canvas></div>');
                $('.friend-statistic-container').append('<div statistic-type="universities" class="friend-university-statistic friend-statistic"><canvas id="friend-university-chart" width="400" height="350"></canvas></div>');
                $('.friend-statistic-container').append('<div statistic-type="schools" class="friend-school-statistic friend-statistic"><canvas id="friend-school-chart" width="400" height="350"></canvas></div>');
                $('.friend-statistic-container').append('<div statistic-type="empty" class="friend-empty-statistic friend-statistic"></div>');

                $('.friend-statistic').hide();
                //$('.friend-statistic:eq(' + (+stateIndex + 1) + ')').show();
                $('.friend-statistic:eq(' + stateIndex + ')').show();

                chrome.runtime.sendMessage({method: "getFriendsInfo", user: user_response[0].uid}, function(response) {
                    addAgeStatistic(response.ages);
                    addUniversityStatistic(response.universities);
                    addSchoolStatistic(response.schools);
                });
            });
        }
    });
    $('#profile_info').on('change', '#friends-select-list', function() {
        $('.friend-statistic').hide();
        $('.friend-statistic[statistic-type="' + $('#friends-select-list').val() + '"]').show();
    });
}

setInterval(function () {
    if ($('#profile_short').length !== 0 && $('.vk-statistics-was-used').length === 0 && $('.friend-statistic-container').length === 0) {
        $('#profile_short').append('<div class="vk-statistics-was-used"></div>');
        renderCharts();
    }
}, UPDATE_TIMEOUT);
