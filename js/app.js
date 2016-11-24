'use strict';

(function() {

  var map;
  var marker;

  // initial map on the screen.
  function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 22.543096, lng: 114.057865},
      zoom: 13
    });
  }

  var markers = [];
  var locations = [{'title': 'Window of the World', 'location': {lat: 22.536818, lng: 113.974514}, 'id':0},
                   {'title': 'Coast City', 'location': {lat: 22.517115, lng: 113.936844}, 'id':1},
                   {'title': 'Dayouli Restaurant', 'location': {lat: 22.51841, lng: 114.06416}, 'id':2},
                   {'title': 'Coco Park', 'location': {lat: 22.534206, lng: 114.053701}, 'id': 3},
                   {'title': 'Da Mei Sha', 'location': {lat: 22.594822, lng: 114.304446}, 'id': 4}];

  // represents one spot.
  var Spot = function(title, location, id) {
    this.title = ko.observable(title);
    this.location = ko.observable(location);
    this.marker = new google.maps.Marker({
          position: location,
          title: title,
          animation: google.maps.Animation.DROP,
          id: id
        });
  };


  var ViewModel = function() {

    var largeInfoWindow = new google.maps.InfoWindow();

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
      return new Spot(spot.title, spot.location, spot.id);
    }));
    this.query = ko.observable('');

    var self = this;

    self.filterItem = ko.computed(function(){
      var filter = self.query().toLowerCase();
      if(!filter) {
        var filtered =  self.spots();
      }else {
        filtered = ko.utils.arrayFilter(self.spots(), function(item){
          return item.title().toLowerCase().indexOf(filter) !== -1;
        });
      }
      return filtered;
    });

    // list items click eventlistener.

    self.resetMarker = ko.computed(function(){

      // if markers exit, remove them.
      if(markers.length !== 0) {
        removeMarker();
      }

      // create markers.
      for(var i = 0; i < self.filterItem().length; i++) {
        // var title = self.filterItem()[i].title();
        // var position = self.filterItem()[i].location();
        // marker = new google.maps.Marker({
        //   position: position,
        //   title: title,
        //   animation: google.maps.Animation.DROP,
        //   id: i
        // });
        // marker.addListener('click', function() {
        //   toggleBounce(this);
        //   populateInfoWindow(this, largeInfoWindow);
        // });
        // markers.push(marker);

        marker = self.filterItem()[i].marker;
        marker.addListener('click', function() {
          toggleBounce(this);
          populateInfoWindow(this, largeInfoWindow);
        });
        markers.push(marker);
      }

      // function toggleBounce(marker) {
      //   if(marker.getAnimation() !== null) {
      //     marker.setAnimation(null);
      //   }else {
      //     marker.setAnimation(google.maps.Animation.BOUNCE);
      //   }
      // }

      // place the markers in the map.
      var bounds = new google.maps.LatLngBounds();
      for(var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
      }
      map.fitBounds(bounds);
    });

    // click list item, focus on the relative marker.
    self.focusMarker = function(spot) {
      toggleBounce(spot.marker);
      populateInfoWindow(spot.marker, largeInfoWindow);
    };

    function toggleBounce(marker) {
      if(marker.getAnimation() !== null) {
        marker.setAnimation(null);
      }else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
      }
    }

    // remove markers from the map.
    function removeMarker() {
      for(var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
      }
      markers = [];
    }

    self.resetMarker();

  };
  initMap();
  ko.applyBindings( new ViewModel() );

})();