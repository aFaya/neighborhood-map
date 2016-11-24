'use strict';

(function() {

  var map;

  // initial map on the screen.
  function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 22.543096, lng: 114.057865},
      zoom: 13
    });
  }

  var markers = [];
  var locations = [{'title': 'wdf', 'location': {lat: 22.505627, lng: 113.932772}},
                   {'title': 'Starbucks', 'location': {lat: 22.517494, lng: 113.935624}},
                   {'title': 'Dayouli Restaurant', 'location': {lat: 22.51841, lng: 114.06416}}
                   ];

  // represents one spot.
  var Spot = function(title, lat, lng) {
    this.title = ko.observable(title);
    this.lat = ko.observable(lat);
    this.lng = ko.observable(lng);
    // this.location = location;
  };

  var ViewModel = function() {

    // initial markers.
    function initMarker() {

      var largeInfoWindow = new google.maps.InfoWindow();
      // create markers.
      for(var i = 0; i < locations.length; i++) {
        var title = locations[i].title;
        var position = locations[i].location;
        var marker = new google.maps.Marker({
          position: position,
          title: title,
          animation: google.maps.Animation.DROP,
          id: i
        });
        marker.addListener('click', function() {
          populateInfoWindow(this, largeInfoWindow);
        });
        markers.push(marker);
      }

      // place the markers in the map.
      var bounds = new google.maps.LatLngBounds();
      for(var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
      }
      map.fitBounds(bounds);
    }

    // pop out the infowindow
    function populateInfoWindow(marker, inforwindow) {
      if(inforwindow.marker != marker) {
        inforwindow.marker = marker;
        inforwindow.setContent('<div>' + marker.title + '</div>');
        inforwindow.open(map,marker);

        inforwindow.addListener('closeclick', function() {
          inforwindow.marker = null;
        });
      }
    }

    this.spots = ko.observableArray(locations.map(function(spot) {
      return new Spot(spot.title, spot.location.lat, spot.location.lng);
    }));

    this.query = ko.observable('');

    var self = this;

    self.filterItem = ko.computed(function(){
      var filter = self.query().toLowerCase();
      if(!filter) {
        console.log(self.spots().length);
        return self.spots();
      }else {
        return ko.utils.arrayFilter(self.spots(), function(item){
          return item.title().toLowerCase().indexOf(filter) !== -1;
        });
      }
    });



    initMarker();



  };
  initMap();
  ko.applyBindings( new ViewModel() );


})();


