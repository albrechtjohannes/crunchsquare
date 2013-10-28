(function() {

    var markers = [];
    var friendMarkers = [];
    var currentMarker;

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
                        "Web: <a href='" + info.web + "' class='theme web'>" + (info.web || "N/A") + "</a><br />" +
                        "preCheck-Ins: " + ((info.checkins || []).join(", ") || "N/A") + "<br />" +
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
                    var text = (i < 9 ? "0" + i : i) + ":" + (j < 9 ? "0" + j : j);
                    var option = $("<option value='" + value + "'>" + text + "</option>");

                    $(this).append(option);
                }
            }
        });
    };

    var currentInfoWindow;

    var addMarker = function(map, position, info) {
        var infoWindow = createInfo(info);

        google.maps.event.addListener(infoWindow, "domready", function() {
            var dialog = $(
                "<div id='checkin-dialog' class='column_8' data-tuktuk='modal'>" +
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
                                        "<span class='content'>From</span>" +
                                    "</a>" +
                                "</label>" +
                                "<span class='select'>" +
                                    "<select class='fromSelect'></select>" +
                                "</span>" +
                            "</fieldset>" +
                            "<fieldset class='time'>" +
                                "<label>" +
                                    "<input type='hidden' class='date till' data-trigger='#checkin-dialog .button.till' />" +
                                    "<a href='#' class='button till'>" +
                                        "<span class='icon calendar'></span> " +
                                        "<span class='content'>Till</span>" +
                                    "</a>" +
                                "</label>" +
                                "<span class='select'>" +
                                    "<select class='tillSelect'></select>" +
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

            dialog.find(".checkin").on("click", function() {
                $.ajax("/new", {
                    data: {
                        venueId: info.id,
                        fromDate: new Date(dialog.find(".from").val() + "/" + dialog.find(".fromSelect").val()).toString(),
                        toDate: new Date(dialog.find(".till").val() + "/" + dialog.find(".tillSelect").val()).toString()
                    },
                    type: "POST",
                    success: function() {
                        var index = markers.indexOf(currentMarker);
                        if (index > -1) {
                            markers.splice(index, 1);
                        }
                        currentMarker.setIcon("/images/marker_busy.png");

                        TukTuk.Modal.hide();
                    }
                });
            });
        });

        var marker = new google.maps.Marker({
            position: position,
            map: map,
            icon: info.checkins && info.checkins.length > 0 ? "/images/marker_busy.png" : "/images/marker.png"
        });

        google.maps.event.addListener(map, "click", function() {
            if(currentInfoWindow) {
                currentInfoWindow.close();
            }
        });

        google.maps.event.addListener(marker, "click", function() {
            if(currentInfoWindow) {
                currentInfoWindow.close();
            }

            currentInfoWindow = infoWindow;
            currentMarker = marker;

            infoWindow.open(map, marker);
        });

        markers.push(marker);

        return marker;
    };

    var clearMap = function(map) {
        $.each(markers, function() {
            if(this.getMap() === map) {
                this.setMap(null);
            }
        });
    };

    var getPhotoHTML = function(user) {
        url = user.photo.prefix + "36x36" + user.photo.suffix;
        return '<img src=' + url + '>';
    }

    var update = function(map, location, dom, clb) {
        if(!location) {
            return;
        }

        var latlng = {
            lng: location.mb,
            lat: location.lb
        };
        $.ajax("/venue", {
            data: {
                lng: location.mb,
                lat: location.lb,
                fromDate: (new Date($(dom.data("from")).val())).toString(),
                toDate: (new Date($(dom.data("till")).val())).toString()
            },
            success: function(venues) {
                var checkins = [];
                console.log(venues)
                var filterCity = venues[0].location.city;


                $.ajax("/friends", {
                    data: {city:filterCity},
                    success: function(friends) {
                        html = '';
                        $.each(friends, function(){
                            html += getPhotoHTML(this);
                        })
                        $('.friendthumbs').html(html);
                    }
                })


                $.each(venues, function() {
                    var venue = this;
                    var location = new google.maps.LatLng(venue.location.lat, venue.location.lng);

                    $.each(venue.preChecked || [], function() {
                        if(checkins.indexOf(this.toString()) === -1) {
                            checkins.push(this.toString());
                        }
                    });

                    addMarker(map, location, {
                        id: venue.id,
                        name: venue.name,
                        phone: venue.contact.formattedPhone,
                        web: venue.url,
                        checkins: venue.preChecked,
                        address: {
                            street: venue.location.address,
                            city: venue.location.city
                        }
                    });
                });

                var slider = $(".slider.friends .future");
                slider.find(".friend").remove();

                $.each(checkins, function() {
                    var entry = $(
                        "<span class='friend button tiny secondary'>" +
                            this.toString() +
                        "</span>"
                    );

                    slider.append(entry);
                });

                if(clb) {
                    clb(map, latlng);
                }
            }
        });
    };

    var registerUpdater = function(selector, target, clb) {
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

            update(target, location, dom, clb);
        });

        return input;
    };

    var createControls = function(kind, clb) {
        var options = {
            zoom: 11,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        var map = getMap(".map ." + kind, options);
        var berlin = new google.maps.LatLng(52.518611,13.408056);

        map.setCenter(berlin);

        var dom = $("header ." + kind + " .search");
        var search = registerUpdater(dom, map, clb);

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

    var toggleSlider = function(selector) {
        var hidden = true;

        var slide = function() {
            $(selector).toggle("slide", {
                direction: "right",
                complete: function() {
                    if(hidden) {
                        $(this).find("> div").fadeIn();
                    }

                    hidden = !hidden;
                }
            });
        };

        if(hidden) {
            var elements = $(selector + "> div").length;

            $(selector + "> div").fadeOut({
                complete: function() {
                    elements = elements - 1;

                    if(elements === 0) {
                        slide();
                    }
                }
            });

            return;
        }

        slide();
    };

    $(document).ready(function() {
        var contentHeight = $("body").height() - $("header").height() - (2 * parseInt($("header").css("padding")));

        $(".map").height(contentHeight);
        $(".slider").height(contentHeight);

        createControls("origin");
        createControls("destination", function(map, location) {
            $.ajax("/current", {
                data: location,
                success: function(friends) {
                    var slider = $(".slider.friends .recent");
                    slider.find(".friend").remove();

                    $.each(friends, function(key, value) {
                        var entry = $(
                            "<span class='friend button tiny secondary'>" +
                                key +
                            "</span>"
                        );

                        slider.append(entry);

                        var position = new google.maps.LatLng(value.lat, value.lng);
                        var marker = addMarker(map, position, {
                            name: key,
                            address: {}
                        });
                    });
                }
            });
        });

        $("form").submit(function() {
            return false;
        });

        $(".divider .group").on("click", function() {
            toggleSlider(".friends");
        });

        $(".divider .inbox").on("click", function() {
            toggleSlider(".news");
        });

        $(".divider .shopping-cart").on("click", function() {
            toggleSlider(".offerings");
        });
    });

}());
