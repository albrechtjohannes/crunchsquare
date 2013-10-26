(function() {

    var markers = [];

    var getAutocompleter = function(selector) {
        return new google.maps.places.Autocomplete($(selector).get(0), {
            types: ["geocode"]
        });
    };

    var getMap = function(selector, options) {
        return new google.maps.Map($(selector).get(0), options);
    };

    var createInfo = function(info) {
        var content = $(
            "<div>" +
                "<div class='info'>" +
                    "<div class='header'>" +
                        "<h4 class='title'>" + info.name + "</h4>" +
                        "<div class='address'>" +
                            info.address.street + " in " +
                            info.address.city +
                        "</div>" +
                    "</div>" +
                    "<div class='content'>" +
                        "<div class='phone'>Phone: " + (info.phone || "N/A") + "</div>" +
                        "Web: <a href='" + info.web + "' class='theme web'>" + (info.web || "N/A") + "</a>" +
                        "<a class='button tiny checkin' href='#'>" +
                            "<i class='fa fa-foursquare'></i> " +
                            "Check-In</a>" +
                    "</div>" +
                "</div>" +
            "</div>"
        );

        return new google.maps.InfoWindow({
            content: content.html()
        });
    };

    var currentInfo;

    var addMarker = function(map, position, info) {
        var info = createInfo(info);
        var marker = new google.maps.Marker({
            position: position,
            map: map,
            icon: "/images/marker.png"
        });

        google.maps.event.addListener(map, "click", function() {
            if(currentInfo) {
                currentInfo.close();
            }
        });

        google.maps.event.addListener(marker, "click", function() {
            if(currentInfo) {
                currentInfo.close();
            }

            currentInfo = info;

            info.open(map, marker);
        });

        markers.push(marker);
    };

    var clearMap = function(map) {
        $.each(markers, function() {
            if(this.getMap() === map) {
                this.setMap(null);
            }
        });
    };

    var registerUpdater = function(selector, target) {
        var input = getAutocompleter(selector);
        var dom = $(selector);

        google.maps.event.addListener(input, "place_changed", function() {
            var place = input.getPlace();

            if(!place.geometry) {
                return;
            }

            var location = place.geometry.location;

            target.setCenter(location);

            clearMap(target);

            $.ajax("/venue", {
                data: {
                    lng: location.mb,
                    lat: location.lb,
                    from: $(dom.data("from")).val(),
                    till: $(dom.data("till")).val()
                },
                success: function(data) {
                    $.each(data.response.venues, function() {
                        var venue = this;
                        var location = new google.maps.LatLng(venue.location.lat, venue.location.lng);

                        addMarker(target, location, {
                            name: venue.name,
                            phone: venue.contact.formattedPhone,
                            web: venue.url,
                            address: {
                                street: venue.location.address,
                                city: venue.location.city
                            }
                        });
                    });
                }
            });
        });
    };

    var toggleSlider = function(content) {
        $(".slider").html(content);
        $(".slider").toggle("slide", {direction: "right"});
    }

    $(document).ready(function() {
        $(".map").height($("body").height() - $("header").height() - (2 * parseInt($("header").css("padding"))));

        var mapOptions = {
            zoom: 12,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        var originMap = getMap(".map .origin", mapOptions);
        var destinationMap = getMap(".map .destination", mapOptions);

        var berlin = new google.maps.LatLng(52.518611,13.408056);

        originMap.setCenter(berlin);
        destinationMap.setCenter(berlin);

        registerUpdater("header .origin .search", originMap);
        registerUpdater("header .destination .search", destinationMap);

        $("form").submit(function() {
            return false;
        });

        $("form .date").each(function() {
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

        $(".divider .group").on("click", function() {
            toggleSlider();
        });

        $(".divider .inbox").on("click", function() {
            toggleSlider();
        });
    });

}());
