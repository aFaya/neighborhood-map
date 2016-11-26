'use strict';

(function() {

  var map;
  // var marker;
  var bounds;

  // initial map on the screen.
  function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 22.543096, lng: 114.057865},
      zoom: 8
    });
  }

  var markers = [];
  var locations = [{'title': 'Window of the World', 'location': {lat: 22.536818, lng: 113.974514}, 'id':0, 'venueId': '4d203115b69c6dcb3af96d95'},
                   {'title': 'Coastal City', 'location': {lat: 22.517115, lng: 113.936844}, 'id':1, 'venueId': '4b8fb877f964a520bb5e33e3'},
                   {'title': 'Happy Valley', 'location': {lat: 22.539592, lng: 113.980597}, 'id':2, 'venueId': '511b3e18e4b09fc6487af493'},
                   {'title': 'Coco Park', 'location': {lat: 22.534206, lng: 114.053701}, 'id': 3, 'venueId': '4e1198e8fa769d21e9ee3f9c'},
                   {'title': 'Da Mei Sha', 'location': {lat: 22.594822, lng: 114.304446}, 'id': 4, 'venueId': '4d3898a740eb2c0fb40a25fe'}];

  // represents one spot.
  var Spot = function(title, location, id, venueId) {
    var self = this;
    this.title = ko.observable(title);
    this.location = ko.observable(location);
    this.marker = new google.maps.Marker({
          position: location,
          title: title,
          animation: google.maps.Animation.DROP,
          id: id
        });
    this.address = '';
    var addressURL = 'https://maps.googleapis.com/maps/api/geocode/json?latlng=' +
                     location.lat + ',' + location.lng +
                     '&key=AIzaSyBZ026_CfNE99A-g2rFqgY9ObeIomvIa1E';

    $.getJSON( addressURL, function( data ) {
      self.address = data.results[0].formatted_address;
    }).fail(function(e){
      self.address = 'Can not get the address.';
    });

    var foursquareURL = 'https://api.foursquare.com/v2/venues/' + venueId +
                        '?client_id=PCQI3LMM5Q3X5JNX2THXJE0A5DKRKCKAF2U3MBKUIXLB3LR0&' +
                        'client_secret=A1LL13CINSJ0HHM1SLWJYALQNNKNZZ5KRYCBICFOLVOGXVAU&v=20161125';
    $.getJSON( foursquareURL, function(data) {
      self.likes = data.response.venue.likes.count;
      self.rating = data.response.venue.rating;
      var items = data.response.venue.tips.groups[0].items;
      // self.tips = data.response.venue.tips.groups[0].items.slice(0,2);
      self.tips = items.length >= 2 ? items : undefined;
    }).fail(function(e){
      self.likes = 0;
      self.rating = 0;
      self.tips = ['no comment','no comment'];
    })

  };


  var ViewModel = function() {

    var largeInfoWindow = new google.maps.InfoWindow({
      maxWidth: 200
    });



    // create new spot list.
    this.spots = ko.observableArray(locations.map(function(spot) {
      return new Spot(spot.title, spot.location, spot.id, spot.venueId);
    }));

    // query input.
    this.query = ko.observable('');

    var self = this;

    // filter the list items by query.
    self.filterItem = ko.computed(function(){
      var filter = self.query().toLowerCase();
      if(!filter) {
        return self.spots();
      }else {
        return ko.utils.arrayFilter(self.spots(), function(item){
          return item.title().toLowerCase().indexOf(filter) !== -1;
        });
      }
    });

    // reset markers in the beginning and when users filter the items.
    self.resetMarker = ko.computed(function(){

      // if markers exit, remove them.
      if(markers.length !== 0) {
        removeMarker();
      }
      // iterate througth the filterItem and repaint them into the map.
      for(var i = 0; i < self.filterItem().length; i++) {
        var marker = self.filterItem()[i].marker;
        marker.addListener('click', function(index) {
          return function() {
            toggleBounce(this);
            // map.setCenter(marker.getPosition);
            populateInfoWindow(self.filterItem()[index], largeInfoWindow);
          };
        }(i));
        markers.push(marker);
      }

      // place the markers in the map.
      bounds = new google.maps.LatLngBounds();
      for(var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
      }
      map.fitBounds(bounds);
    });

    // click list item, focus on the relative marker.
    // first parameter is the current item clicked --- knockoutjs.
    self.focusMarker = function(spot) {
      toggleBounce(spot.marker);
      populateInfoWindow(spot, largeInfoWindow);
    };

    // add animation when clicking marker.
    function toggleBounce(marker) {
      if(marker.getAnimation() !== null) {
        marker.setAnimation(null);
      }else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
      }
      // set other markers animation to null.
      for(var i = 0; i < markers.length; i++) {
        if(markers[i] !== marker) {
          markers[i].setAnimation(null);
        }
      }
    }

    // remove markers from the map.
    function removeMarker() {
      for(var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
        // remove marker listener.
        google.maps.event.clearListeners(markers[i], 'click');
      }
      markers = [];
    }

    // pop out the infowindow
    function populateInfoWindow(spot, inforwindow) {
      if(inforwindow.marker != spot.marker) {
        inforwindow.setContent('');
        inforwindow.marker = spot.marker;

        inforwindow.addListener('closeclick', function() {
          inforwindow.marker = null;
        });

        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;
        // In case the status is OK, which means the pano was found, compute the
        // position of the streetview image, then calculate the heading, then get a
        // panorama from that and set the options
        function getStreetView(data, status) {
          if (status == google.maps.StreetViewStatus.OK) {
            var nearStreetViewLocation = data.location.latLng;
            var heading = google.maps.geometry.spherical.computeHeading(
              nearStreetViewLocation, spot.marker.position);
              inforwindow.setContent('<h3>Name: <span>' + spot.marker.title + '</span></h3>' +
                                     '<h3>Address: <span>' + spot.address + '</span></h3>' +
                                     '<div id="pano"></div>' +
                                     '<div><h3>Foursquare Likes: <span>' + spot.likes + '</span></h3>' +
                                     '<h3>Foursquare Rating: <span>' + spot.rating + '/10</span></h3>' +
                                     '<h3>Foursquare Tips: </h3><p>1. ' + spot.tips[0].text + ' ---- ' + spot.tips[0].user.firstName + '</p>' +
                                     '<p>2. ' + spot.tips[1].text + ' ---- ' + spot.tips[1].user.firstName + '</p>' + '</div>');
              var panoramaOptions = {
                position: nearStreetViewLocation,
                pov: {
                  heading: heading,
                  pitch: 30
                }
              };
            var panorama = new google.maps.StreetViewPanorama(
              document.getElementById('pano'), panoramaOptions);
          } else {
            inforwindow.setContent('<h3>Name: <span>' + spot.marker.title + '</span></h3>' +
                                   '<h3>Address: <span>' + spot.address + '</span></h3>' +
                                   '<div>No Street View Found</div>' +
                                   '<div><h3>Foursquare Likes: <span>' + spot.likes + '</span></h3>' +
                                   '<h3>Foursquare Rating: <span>' + spot.rating + '/10</span></h3>' +
                                   '<h3>Foursquare Tips: </h3><p>1. ' + spot.tips[0].text + ' ---- ' + spot.tips[0].user.firstName + '</p>' +
                                   '<p>2. ' + spot.tips[1].text + ' ---- ' + spot.tips[1].user.firstName + '</p>' + '</div>');
          }
        }
        // Use streetview service to get the closest streetview image within
        // 50 meters of the spot.markers position
        streetViewService.getPanoramaByLocation(spot.marker.position, radius, getStreetView);

        inforwindow.open(map,spot.marker);

      }
    }

    self.resetMarker();

  };

  initMap();
  var center = ko.observable(map.getCenter());
  $(window).resize(function() {
    map.panTo(center());
    map.fitBounds(bounds);
  });

  ko.applyBindings( new ViewModel() );

})();