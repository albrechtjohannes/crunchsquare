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

    var addMarker = function(map, position) {
        markers.push(new google.maps.Marker({
            position: position,
            map: map
        }));
    };

    var clearMap = function(map) {
        $.each(markers, function() {
            if(this.getMap() === map) {
                this.setMap(null);
            }
        });
    };

    var registerUpdater = function(input, target) {
        google.maps.event.addListener(input, "place_changed", function() {
            var place = input.getPlace();

            if(!place.geometry) {
                return;
            }

            var location = place.geometry.location;

            target.setCenter(location);

            clearMap(target);
            addMarker(target, location);

            $.ajax("/venue", {
                data: location,
                success: function() {
                    console.log("foo");
                }
            })
        });
    };

    $(document).ready(function() {
        $(".map").height($("body").height() - $("header").height() - (2 * parseInt($("header").css("padding"))));

        var mapOptions = {
            zoom: 10,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        var originMap = getMap(".map .origin", mapOptions);
        var destinationMap = getMap(".map .destination", mapOptions);

        var berlin = new google.maps.LatLng(52.518611,13.408056);

        originMap.setCenter(berlin);
        destinationMap.setCenter(berlin);

        var origin = getAutocompleter("header .origin .search");
        var destination = getAutocompleter("header .destination .search");

        registerUpdater(origin, originMap);
        registerUpdater(destination, destinationMap);

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
    });

}());
