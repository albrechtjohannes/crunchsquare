(function() {

    var currentMarker, currentInfoWindow;

    var submitSearchForm = function() {
        var form = $('#search').serializeArray();

        var city = form[0].value;
        var venue = form[1].value;

        $("#fs_search_results").empty();

        if (venue && city) {
            $.ajax('/search', {
                data: {
                    searchTerm: venue,
                    near: city
                },
                success: function(data) {
                    var venues = data.groups[0].items;
                    // var venues = data.venues;
                    var dom = $('#venues');
                    dom.empty();
                    for (var i = 0; i < venues.length; i++) {
                        var venue = venues[i].venue;
                        // var venue = venues[i];
                        if (venue.stats.checkinsCount >= 1 && venue.categories[0]) {
                            var s = '';
                            s += '<a href="#">';
                            s += '<div class="column_4 margin-bottom padding bck light venue" data-tuktuk-modal="checkin-dialog" id="' + venue.id + '">';
                            s += '<h4>' + venue.name + '<span class="icon plus on-right"></span></h4>';
                            s += '<div>';
                            s += (venue.location.city) ? '<small class="padding-right text bold">' + venue.location.city  +'</small>' : '';
                            s += (venue.categories[0].name) ? '<small>' + venue.categories[0].name  +'</small>' : '';
                            s += '</div></div></a>';
                            dom.append(s);

                            $('#'+venue.id).data('location', venue.location);
                            $('#'+venue.id).data('venueName', venue.name);
                        } else {
                            console.log(venue);
                        }
                    }

                    createModalView();
                }
            });
        }
    };

    function createInfoWindow(checkin) {
        var photoHtml = '';
        $.each((checkin.userImages || []), function() {
            photoHtml += '<img class="padding-right"src="' + this + '">';
        });

        var content = $(
            '<div>' +
                '<div class="info">' +
                    '<div class="header">' +
                        '<h4 class="title">' + checkin.venueName + '</h4>' +
                    '</div>' +
                    '<div class="content">' +
                        'preCheck-Ins: ' + photoHtml + ' <br />' +
                    '</div>' +
                '</div>' +
            '</div>'
        );

        return new google.maps.InfoWindow({
            content: content.html()
        });
    }

    function addMarker(map, point, checkin) {
        var infoWindow = createInfoWindow(checkin);

        var marker = new google.maps.Marker({
            position: point,
            map: map,
            title: checkin.venueName,
            icon: '/images/marker_busy.png'
        });

        google.maps.event.addListener(map, "click", function() {
            if (currentInfoWindow) {
                currentInfoWindow.close();
            }
        });

        google.maps.event.addListener(marker, 'click', function() {
            if (currentInfoWindow) {
                currentInfoWindow.close();
            }

            currentInfoWindow = infoWindow;
            currentMarker = this;

            infoWindow.open(map, this);
        });
    }

    function initialize() {
        var mapOptions = {
            center: new google.maps.LatLng(52.518611, 13.408056),
            zoom: 7,
            panControl: false,
            zoomControl: false,
            scaleControl: true,
            streetViewControl: false,
            mapTypeControl: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById('map'), mapOptions);

        var bounds = new google.maps.LatLngBounds();

        var markers = [];

        $.ajax('/checkin', {
            data: {
                friends: true,
                me: true,
                group: true
            },
            success: function(checkins) {
                markers = [];
                for (var venueId in checkins) {
                    if (checkins.hasOwnProperty(venueId)) {
                        var checkin = checkins[venueId];
                        var point = new google.maps.LatLng(checkin.loc.lat, checkin.loc.lon);
                        addMarker(map, point, checkin);
                        bounds.extend(point);
                    }
                }
                map.fitBounds(bounds);
                // map.setOptions({zoom: 7});
            }
        });
    }

    function getCheckins() {
        var columns = [{
            div: 'my-checkins',
            friends: false
        }, {
            div: 'friends-checkins',
            friends: true
        }];

        $.each(columns, function(_, item) {
            $.ajax('/checkin', {
                data: {
                    friends: item.friends,
                },
                success: function(checkins) {
                    var dom = $('#'+item.div);
                    dom.empty();
                    for (var i = 0; i < checkins.length; i++) {
                        var checkin = checkins[i];
                        var s = '';
                        s += '<div class="margin-bottom padding bck light" id="' + checkin._id + '">';
                        s += '<h3>' + checkin.venueName;
                        s += (!item.friends) ? '<a href="#"><span class="icon remove on-right"></span></a>' : '<img class="on-right" src="' + checkin.photo_urls.medium_thumb + '"/>';
                        s += '</h3>';
                        s += '<small class="padding-right text bold">' + new Date(checkin.timestamp).toLocaleString() + '</small>';
                        s += '</div>';
                        dom.append(s);
                    }
                    if (!item.friends) {
                        $('a .remove').click(function() {
                            var that = this.parentElement.parentElement.parentElement;
                            console.log(that);
                            $.ajax('/checkin', {
                                data: {
                                    id: that.id
                                },
                                type: 'DELETE',
                                success: function(result) {
                                    that.remove();
                                }
                            });
                        });
                    }
                }
            });
        });
    }

    function getCheckinsPerUser() {
        $.ajax('/checkin', {
            data: {
                friends: true,
                me: false
            },
            success: function(checkins) {
                console.log(checkins);
                for (var i = 0; i < checkins.length; i++) {
                    var checkin = checkins[i];
                    var dom = $('#'+checkin.userId);
                    var s = '';
                    s += '<div class="padding bck light">';
                    s += '<p class="text bold">' + checkin.venueName + "</p>";
                    s += '<small class="padding-right">' + new Date(checkin.timestamp).toLocaleString() + '</small>';
                    s += '</div>';
                    dom.append(s);
                }
            }
        });
    }

    function getAutocompleter(selector) {
        return new google.maps.places.Autocomplete($(selector).get(0), {
            types: ['geocode']
        });
    }

    function createTimeOptions(selects) {
        selects.each(function() {
            var i, j;

            for(i = 0; i < 24; i = i + 1) {
                for(j = 0; j < 60; j = j + 60) {
                    var value = (i < 9 ? "0" + i : i) + ":" + (j < 9 ? "0" + j : j);
                    var text = (i < 9 ? "0" + i : i) + ":" + (j < 9 ? "0" + j : j);
                    var option = $("<option value='" + value + "'>" + text + "</option>");

                    $(this).append(option);
                }
            }
            $(".fromSelect").val("12:00");
        });
    }


    function createModalView() {
        var dialog = $(
            "<div id='checkin-dialog' class='column_8' data-tuktuk='modal'>" +
                "<header class='bck color'>" +
                    "<h4>Check-In</h4>" +
                "</header>" +
                "<article>" +
                    "<form>" +
                        "<fieldset class='time'>" +
                            "<label>" +
                                "<input type='hidden' class='date from' data-trigger='#checkin-dialog .button.from' />" +
                                "<a href='javascript:void(0)' class='button from secondary'>" +
                                    "<span class='icon calendar'></span> " +
                                    "<span class='content'>Date</span>" +
                                "</a>" +
                            "</label>" +
                            "<select class='fromSelect'></select>" +
                        "</fieldset>" +
                    "</form>" +
                "</article>" +
                "<footer>" +
                    "<button class='secondary margin' data-modal='close'>" +
                        "<span class='icon remove'></span> " +
                        "Close" +
                    "</button>" +
                    "<button class='checkin bck color margin'>" +
                        "<i class='fa fa-foursquare'></i> " +
                        "preCheck-In" +
                    "</button>" +
                "</footer>" +
            "</div>"
        );

        $("body").append(dialog);

        createTimeOptions(dialog.find("select"));

        dialog.find("form .date").each(function() {
            var input = $(this);

            input.datepicker({
                onSelect: function(date) {
                    trigger.children(".content").html(date);
                }
            });

            var trigger = $(input.data("trigger"));
            trigger.click(function() {
                input.datepicker("show");
            });
        });

        $("[data-tuktuk-modal]").click(function() {
            $('#checkin-dialog').data('venueId', $(this).get(0).id);
            $('#checkin-dialog').data('location', $(this).data('location'));
            $('#checkin-dialog').data('venueName', $(this).data('venueName'));
            return TukTuk.Modal.show(TukTuk.dom(this).attr('data-tuktuk-modal'));
        });

        $("[data-tuktuk=modal] [data-modal=close]").click(function() {
            return TukTuk.Modal.hide();
        });

        dialog.find(".checkin").click(function() {
            var location = $('#checkin-dialog').data('location');
            var venueName = $('#checkin-dialog').data('venueName');
            var venueId = $('#checkin-dialog').data('venueId');
            $.ajax("/checkin", {
                data: {
                    location: location,
                    venueName: venueName,
                    venueId: venueId,
                    date: new Date(dialog.find(".from").val() + "/" + dialog.find(".fromSelect").val()).toString(),
                },
                type: "POST",
                success: function(data) {
                    TukTuk.Modal.hide();
                    console.log(data);
                    window.location.href = "/map";
                }
            });
        });
    }

    $(document).ready(function() {
        var contentHeight = $('body').height() - $('header').height() - 48;

        $('#map').height(contentHeight);
        $('#map').height();

        $('#search-btn').click(submitSearchForm);

        $('form').submit(function() {
            return false;
        });

        if (location.pathname === '/map') {
            google.maps.event.addDomListener(window, 'load', initialize);
        }
        if (location.pathname === '/') {
            getAutocompleter('#city');
        }
        if (location.pathname === '/checkins') {
            getCheckins();
        }

        if (location.pathname === '/contacts') {
            getCheckinsPerUser();
        }

        $('#venue').fs_suggest({
            client_id: 'PSK5SC5EPW2DJ2CA5OQI5CBFMMFOH3UGKZZ0IEBQLEIYNVOW',
            client_secret: 'QVYG524JV02VUJTYLFC2CAIO5W544R30XCRESYB04NN0GYKE',
            ll: '',
            nearSelector: "city",
            limit: 10
        });

        $('#venue').keypress(function(e) {
            if (e.keyCode == 13) {
                $('#search a').click();
            }
        });

        $('a[href="' + location.pathname + '"]').addClass('active');

    });

}());