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
                        "<a class='button tiny checkin' data-tuktuk-modal='checkin-dialog' href='#'>" +
                            "<i class='fa fa-foursquare'></i> " +
                            "Pre-Check-In with foursquare</a>" +
                    "</div>" +
                "</div>" +
            "</div>"
        );

        return new google.maps.InfoWindow({
            content: content.html()
        });
    };

    var createTimeOptions = function(selects) {
        selects.each(function() {
            var i, j;

            for(i = 0; i < 24; i = i + 1) {
                for(j = 0; j < 60; j = j + 15) {
                    var value = (i < 9 ? "0" + i : i) + ":" + (j < 9 ? "0" + j : j);
                    var option = $("<option value='" + value + "'>" + value + "</option>");

                    $(this).append(option);
                }
            }
        });
    };

    var currentInfo;

    var addMarker = function(map, position, info) {
        var info = createInfo(info);

        google.maps.event.addListener(info, "domready", function() {
            var dialog = $(
                "<div id='checkin-dialog' class='column_6' data-tuktuk='modal'>" +
                    "<header>" +
                        "Check-In" +
                    "</header>" +
                    "<article>" +
                        "<form>" +
                            "<fieldset>" +
                                "<label>All day:</label>" +
                                "<input type='checkbox' /><br />" +
                            "</fieldset>" +
                            "<fieldset class='time'>" +
                                "<label>" +
                                    "<input type='hidden' class='date from' data-trigger='#checkin-dialog .button.from' />" +
                                    "<a href='#' class='button from'>" +
                                        "<span class='icon calendar'></span> " +
                                        "From" +
                                    "</a>" +
                                "</label>" +
                                "<span class='select'>" +
                                    "<select></select>" +
                                "</span>" +
                            "</fieldset>" +
                            "<fieldset class='time'>" +
                                "<label>" +
                                    "<input type='hidden' class='date till' data-trigger='#checkin-dialog .button.till' />" +
                                    "<a href='#' class='button till'>" +
                                        "<span class='icon calendar'></span> " +
                                        "Till" +
                                    "</a>" +
                                "</label>" +
                                "<span class='select'>" +
                                    "<select></select>" +
                                "</span>" +
                            "</fieldset>" +
                        "</form>" +
                    "</article>" +
                    "<footer>" +
                        "<button data-modal='close'>" +
                            "<span class='icon remove'></span> " +
                            "Close" +
                        "</button>" +
                        "<button class='checkin'>" +
                            "<i class='fa fa-foursquare'></i> " +
                            "Check-In" +
                        "</button>" +
                    "</footer>" +
                "</div>"
            );

            $("body").append(dialog);

            createTimeOptions(dialog.find("select"));

            dialog.find("form .date").each(function() {
                var input = $(this);

                input.datepicker();

                var trigger = $(input.data("trigger"));
                trigger.click(function() {
                    input.datepicker("show");
                });
            });

            dialog.find("input[type=checkbox]").click(function() {
                var checkbox = $(this);

                if(checkbox.is(":checked")) {
                    dialog.find(".time").slideUp();
                } else {
                    dialog.find(".time").slideDown();
                }
            });

            TukTuk.dom("[data-tuktuk-modal]").on("click", function() {
                return TukTuk.Modal.show(TukTuk.dom(this).attr('data-tuktuk-modal'));
            });

            TukTuk.dom("[data-tuktuk=modal] [data-modal=close]").on("click", function() {
                return TukTuk.Modal.hide();
            });
        });

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

    var update = function(map, location, dom) {
        if(!location) {
            return;
        }

        $.ajax("/venue", {
            data: {
                lng: location.mb,
                lat: location.lb,
                from: (new Date($(dom.data("from")).val())).toString(),
                till: (new Date($(dom.data("till")).val())).toString()
            },
            success: function(data) {
                $.each(data.response.venues, function() {
                    var venue = this;
                    var location = new google.maps.LatLng(venue.location.lat, venue.location.lng);

                    addMarker(map, location, {
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

            update(target, location, dom);
        });

        return input;
    };

    var createControls = function(kind) {
        var options = {
            zoom: 12,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        var map = getMap(".map ." + kind, options);
        var berlin = new google.maps.LatLng(52.518611,13.408056);

        map.setCenter(berlin);

        var dom = $("header ." + kind + " .search");
        var search = registerUpdater(dom, map);

        $("form ." + kind + " .date").each(function() {
            var input = $(this);
            input.datepicker({
                onSelect: function(date) {
                    trigger.children(".content").html(date);

                    var place = search.getPlace();

                    if(!place) {
                        return;
                    }

                    update(map, place.geometry.location, dom);
                }
            });

            var trigger = $(input.data("trigger"));

            trigger.click(function() {
                input.datepicker("show");
            });
        });
    };

    var toggleSlider = function(content) {
        $(".slider").html(content);
        $(".slider").toggle("slide", {direction: "right"});
    };

    $(document).ready(function() {
        var contentHeight = $("body").height() - $("header").height() - (2 * parseInt($("header").css("padding")));

        $(".map").height(contentHeight);
        $(".slider").height(contentHeight);

        createControls("origin");
        createControls("destination");

        $("form").submit(function() {
            return false;
        });

        $(".divider .group").on("click", function() {
            toggleSlider();
        });

        $(".divider .inbox").on("click", function() {
            toggleSlider();
        });
    });

}());
