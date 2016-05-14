var MAX_LEGEND_STRING_LENGTH = 25;
var MAX_LEGEND_ITEMS_NUMBER = 18;
var UPDATE_TIMEOUT = 100;
var OLD_SELECTOR = '#profile_short .profile_info';
var NEW_SELECTOR = '#profile_short';

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



function fmtChartJSPerso(config, value, fmt){
    if (fmt === "Cutting") {
        return value.length <= MAX_LEGEND_STRING_LENGTH ? value : value.substring(0, MAX_LEGEND_STRING_LENGTH - 3) + '...';
    }
    return value;
}

function drawBarChart(response, selector) {
    var ctx = $(selector).get(0).getContext("2d");
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
    for (var item in response) {
        if (item && !isNaN(item)) {
            data.labels.push(item);
            for (var gender = 0; gender < 3; gender++) {
                data.datasets[gender].data.push(response[item][gender]);
            }
        }
    }
    var myLineChart = new Chart(ctx).StackedBar(data, {
        yAxisMinimumInterval : 1,
    });
}

function drawPieChart(response, selector) {
    var ctx = $(selector).get(0).getContext("2d");
    response = sortObject(response, MAX_LEGEND_ITEMS_NUMBER);
    var data = [];

    for (var item in response) {
        data.push({
            label: item,
            value: response[item],
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

function DropDown(el) {
    this.dd = el;
    this.initEvents();
}
DropDown.prototype = {
    initEvents : function() {
        var obj = this;
        obj.dd.on('click', function(event){
            $(this).toggleClass('active');
            if ($(event.target).is('span')){
                $('.friend-statistic').hide();
                $('.friend-statistic[statistic-type="' + $(event.target).attr('statistic-type') + '"]').show();
                $('.friends-chart-current-choice').text($(event.target).text());
            }
            event.stopPropagation();
        });
    }
};

function renderCharts(version) {
    var user = document.location.pathname.slice(1);
    var blockWidth = version === 'old' ? 400 : 510;
    chrome.runtime.sendMessage({method: "isUser", user: user}, function(user_response) {
        if (!$.isEmptyObject(user_response)) {
            $('#profile_short').before('<div class="friend-statistic-container ' + 'friend-statistic-container-' + version + '"></div>');
            if ($('#friends-chart-dropdown') !== 0) {
                $('.friend-statistic-container').append(
                    '<div class="profile_info"><div class="clear_fix friends-statistics-selector">' +
                        '<div class="label fl_l">Статистика по друзьям:</div>' +
                        '<div class="labeled fl_l usual-overflow">' +
                            '<div id="fcdd" class="friends-chart-wrapper-dropdown"><span class="friends-chart-current-choice">Показать статистику</span>' +
                                '<ul id="friends-chart-dropdown" class="friends-chart-dropdown">' +
                                '</ul>' +
                            '</div>' +
                        '</div>' +
                    '</div></div>'
                );
            }

            var dd = new DropDown($('#fcdd'));
            $(document).click(function() {
                $('.friends-chart-wrapper-dropdown').removeClass('active');
            });

            chrome.runtime.sendMessage({method: "getDefaultState"}, function(stateIndex) {
                var options = [
                    {
                        'name': 'Скрыто',
                        'statistics_type': 'empty',
                        'canvasType': 'None',
                    }, {
                        'name': 'Статистика городов',
                        'statistics_type': 'cities',
                        'canvasType': 'Pie',
                        'width': blockWidth,
                        'height': 350,
                    }, {
                        'name': 'Статистика возрастов',
                        'statistics_type': 'age',
                        'canvasType': 'Bar',
                        'width': blockWidth,
                        'height': 250,
                    }, {
                        'name': 'Статистика университетов',
                        'statistics_type': 'universities',
                        'canvasType': 'Pie',
                        'width': blockWidth,
                        'height': 350,
                    }, {
                        'name': 'Статистика школ',
                        'statistics_type': 'schools',
                        'canvasType': 'Pie',
                        'width': blockWidth,
                        'height': 350,
                    },
                ];

                for (var option = 0; option < options.length; option++) {
                    $('.friends-chart-dropdown').append('<li class="friends-chart-dropdown-item"><span statistic-type="' + options[option].statistics_type + '" href="#">' + options[option].name + '</span></li>');
                }
                $('.friends-chart-current-choice').text(options[stateIndex].name);

                for (var option = 0; option < options.length; option++) {
                    var divString = '<div statistic-type="' + options[option].statistics_type + '" class="friend-' + options[option].statistics_type + '-statistic friend-statistic">';
                    if (options[option].canvasType !== 'None') {
                        divString += '<canvas id="friend-' + options[option].statistics_type + '-chart" width="' + options[option].width + '" height="' + options[option].height + '"></canvas>';
                    }
                    divString += '</div>';
                    $('.friend-statistic-container').append(divString);
                }

                $('.friend-statistic').hide();
                $('.friend-statistic:eq(' + stateIndex + ')').show();

                chrome.runtime.sendMessage({method: "getFriendsInfo", user: user_response[0].uid}, function(response) {
                    drawBarChart(response.ages, "#friend-age-chart");
                    drawPieChart(response.universities, "#friend-universities-chart");
                    drawPieChart(response.schools, "#friend-schools-chart");
                    drawPieChart(response.cities, "#friend-cities-chart");
                });
            });
        }
    });
}

function injectToPage(version) {
    var injectBlockSelector = version === 'old' ? OLD_SELECTOR : NEW_SELECTOR;

    if ($('#profile_short').length !== 0 && $('.vk-statistics-was-used').length === 0 && $('.friend-statistic-container').length === 0) {
        $(injectBlockSelector).append('<div class="clear_fix vk-statistics-was-used"></div>');
        setTimeout(function () {
            renderCharts(version);
        }, UPDATE_TIMEOUT);
    }
}

setInterval(function () {
    if ($('.profile_info_short').length === 0) {
        injectToPage('old');
    } else {
        injectToPage('new');
    }
}, UPDATE_TIMEOUT);
