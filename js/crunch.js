(function() {

    var getAutocompleter = function(selector) {
        return new google.maps.places.Autocomplete($(selector).get(0), {
            types: ["geocode"]
        });
    };

    var getMap = function(selector, options) {
        return new google.maps.Map($(selector).get(0), options);
    };

    var registerUpdater = function(input, target) {
        google.maps.event.addListener(input, "place_changed", function() {
            var place = input.getPlace();

            target.setCenter(place.geometry.location);
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

        var origin = getAutocompleter("header .origin");
        var destination = getAutocompleter("header .destination");

        registerUpdater(origin, originMap);
        registerUpdater(destination, destinationMap);

        $("form").submit(function() {
            return false;
        });
    });

}());
