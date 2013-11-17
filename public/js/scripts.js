(function() {

    var currentMarker, currentInfoWindow;

    var submitSearchForm = function(id) {
        var form = $('#search').serializeArray();

        var venue = form[0].value;
        var city = form[1].value;

        if (venue && city) {
            $.ajax('/search', {
                data: {
                    searchTerm: venue,
                    near: city
                },
                success: function(data) {
                    var venues = data.venues;
                    var dom = $('#venues');
                    dom.empty();
                    for (var i = 0; i < venues.length; i++) {
                        var venue = venues[i];
                        if (venue.stats.checkinsCount>10) {
                            // console.log(venue);
                            var s = '';
                            s += '<a href="#">';
                            s += '<div class="column_4 margin-bottom padding bck light venue" id="' + venue.id + '">';
                            s += '<h4>' + venue.name + '<span class="icon plus on-right"></span></h4>';
                            s += '<div>';
                            s += (venue.location.city) ? '<small class="padding-right text bold">' + venue.location.city  +'</small>' : '';
                            s += (venue.categories[0].name) ? '<small>' + venue.categories[0].name  +'</small>' : '';
                            s += '</div></div></a>';
                            dom.append(s);

                            $('#'+venue.id).data('location', venue.location);
                            $('#'+venue.id).data('venueName', venue.name);
                        }
                    }

                    $('a .venue').click(function() {
                        var location = $(this).data('location');
                        var venueName = $(this).data('venueName');
                        $.ajax('/checkin', {
                            data: {
                                location: location,
                                venueName: venueName,
                                venueId: this.id
                            },
                            type: 'POST',
                            success: function(result) {
                                console.log(result);
                                window.location.href = "/map";
                            }
                        });
                    });
                }
            });
        }
    };

    function createInfoWindow(checkin) {
        var photoHtml = '';
        $.each((checkin.userImages || []), function() {
            photoHtml += "<img src='" + this + "'>";
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
                        s += '<a href="#">';
                        s += '<div class="margin-bottom padding bck light checkin" id="' + checkin._id + '">';
                        s += '<h3>' + checkin.venueName;
                        s += (!item.friends) ? '<span class="icon remove on-right"></span>' : '<img class="on-right" src="' + checkin.photo_urls.medium_thumb + '"/>';
                        s += '</h3>';
                        s += '<small class="padding-right text bold">' + new Date(checkin.timestamp).toDateString() + '</small>';
                        s += '</div></a>';
                        dom.append(s);
                    }
                    if (!item.friends) {
                        $('a .checkin').click(function() {
                            var that = this;
                            $.ajax('/checkin', {
                                data: {
                                    id: this.id
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

    function getAutocompleter(selector) {
        return new google.maps.places.Autocomplete($(selector).get(0), {
            types: ['geocode']
        });
    }

    $(document).ready(function() {
        var contentHeight = $('body').height() - $('header').height() - 3 * (parseInt($('header').css('padding')));

        $('#map').height(contentHeight);

        $('#search a').click(submitSearchForm);

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

        $("input[name='city']").keypress(function(e) {
            if (e.keyCode == 13) {
                $('#search a').click();
            }
        });

        // $('a[href="' + location.pathname + '"').addClass('active');

    });

}());