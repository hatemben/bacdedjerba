  var map;
  var directionDisplay;
  var directionsService;
  var stepDisplay;
 
  var position;
  var marker = [];
  var polyline = [];
  var poly2 = [];
  var poly = null;
  var startLocation = [];
  var endLocation = [];
  var timerHandle = [];
  var currentDistance = [];
    
  
  var speed = 0.000005, wait = 1;
  var infowindow = null;
  
  var myPano;   
  var panoClient;
  var nextPanoId;
  var offset = +1; // Timezone
  
  var startLoc = new Array();
  startLoc[0] = '33.715994,10.7406149';
  startLoc[1] = '33.697818,10.7350094';

  var endLoc = new Array();
  endLoc[0] = '33.697818,10.7350094';
  endLoc[1] = '33.715994,10.7406149';

  var Labels = new Array();
  Labels[0] = 'Ajim - Djerba';
  Labels[1] = 'Kheiredine - Djerba';


  var Steps = new Array(); // Vitesse de chaque bac en m/s
  Steps[0] = 1.8333;
  Steps[1] = 1.8333;

  var Colors = ["#FF0000", "#00FF00", "#0000FF"];
 // Generate daily timeline
 var series = generate_series(30)
 var CurrentBac
 var NextBac
 var Now =  new Date( new Date().getTime() + offset * 3600 * 1000).toUTCString().replace( / GMT$/, "" )


function initialize() {  

  infowindow = new google.maps.InfoWindow(
    { 
      size: new google.maps.Size(150,50)
    });

    var myOptions = {
      zoom: 10,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

    address = '33.7057004,10.7406648'
    geocoder = new google.maps.Geocoder();
    geocoder.geocode( { 'address': address}, function(results, status) {

    }); 
   setRoutes();

  var legend = document.getElementById('legend');
  var div = document.createElement('div');
  var legendtext = '<table><tr><td>'
  for (var i = 0; i <= (series.length - 1); i++) {
    if (series[i]  == NextBac){ // Highlight next bac
      legendtext += '<li id="li_'+i+'"><strong>'+series[i]+'</strong></li>';

    } else {
      legendtext += '<li id="li_'+i+'">'+series[i]+'</li>';      
    }
    if (i == Math.round(series.length/2)-1) legendtext += '</td><td>';
  }
  legendtext += '</td></tr></table>';
  div.innerHTML = legendtext;
  legend.appendChild(div);
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(document.getElementById('legend'));  
  } 


function createMarker(latlng, label, html,icon) {
// alert("createMarker("+latlng+","+label+","+html+","+color+")");
    var contentString = '<b>'+label+'</b><br/>'+'<u>Durée de la traversée</u> : ~20 minutes<br/> <u>Capacité</u> : ~24-30 Véhicules<br/><u>Vitesse moyenne</u> : ~6.6km/h';
    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: label,
        icon: icon,
        zIndex: Math.round(latlng.lat()*-100000)<<5
        });
        marker.myname = label;


    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(contentString); 
        infowindow.open(map,marker);
        });
    return marker;
}  

function setRoutes(){   

    var directionsDisplay = new Array();

    for (var i=0; i< startLoc.length; i++){

    var rendererOptions = {
        map: map,
        suppressMarkers : true,
        preserveViewport: true
    }
    directionsService = new google.maps.DirectionsService();

    var travelMode = google.maps.DirectionsTravelMode.DRIVING;  

    var request = {
        origin: startLoc[i],
        destination: endLoc[i],
        travelMode: travelMode
    };  

        directionsService.route(request,makeRouteCallback(i,directionsDisplay[i]));

    }   


    function makeRouteCallback(routeNum,disp){
        if (polyline[routeNum] && (polyline[routeNum].getMap() != null)) {
         startAnimation(routeNum);
         return;
        }
        return function(response, status){
          
          if (status == google.maps.DirectionsStatus.OK){

            var bounds = new google.maps.LatLngBounds();
            var route = response.routes[0];
            startLocation[routeNum] = new Object();
            endLocation[routeNum] = new Object();


            polyline[routeNum] = new google.maps.Polyline({
            path: [],
            strokeColor: '#FFFF00',
            strokeWeight: 3
            });

            poly2[routeNum] = new google.maps.Polyline({
            path: [],
            strokeColor: '#FFFF00',
            strokeWeight: 3
            });     


            // For each route, display summary information.
            var path = response.routes[0].overview_path;
            var legs = response.routes[0].legs;

            disp = new google.maps.DirectionsRenderer(rendererOptions);     
            disp.setMap(map);
            disp.setDirections(response);


            //Markers               
            for (i=0;i<legs.length;i++) {
              if (i == 0) { 
                startLocation[routeNum].latlng = legs[i].start_location;
                startLocation[routeNum].address = legs[i].start_address;
                // marker = google.maps.Marker({map:map,position: startLocation.latlng});
                marker[routeNum] = createMarker(legs[i].start_location,Labels[routeNum],legs[i].start_address,"mapIcons/marker"+routeNum+".png",routeNum);
              }
              endLocation[routeNum].latlng = legs[i].end_location;
              endLocation[routeNum].address = legs[i].end_address;
              var steps = legs[i].steps;

              for (j=0;j<steps.length;j++) {
                var nextSegment = steps[j].path;                
                var nextSegment = steps[j].path;

                for (k=0;k<nextSegment.length;k++) {
                    polyline[routeNum].getPath().push(nextSegment[k]);
                     bounds.extend(nextSegment[k]);
                }

              }
            }

         }       

         polyline[routeNum].setMap(map);
         map.fitBounds(bounds);

         // Calculate local time 
         var Now =  new Date( new Date().getTime() + offset * 3600 * 1000).toUTCString().replace( / GMT$/, "" )
         for (var i = series.length - 1; i >= 0; i--) {
         	// Difference to locate current position
           var Diff = Date.parse(Now) - Date.parse(series[i])
           // Determine current Bac
           if (Diff > 0 && CurrentBac == null){
            var CurrentBac = series[i]
           }
         }

        // By default start animation from actual position
         startAnimation(routeNum, (Steps[routeNum]*(Diff)/1000));  

    } 

  }

}

    var lastVertex = 1;
    var stepnum=0;
    var tick = 1000; // milliseconds
    var eol= [];
    var go = '0'; // 
//----------------------------------------------------------------------                
 function updatePoly(i,d) {
 // Spawn a new polyline every 20 vertices, because updating a 100-vertex poly is too slow
    if (poly2[i].getPath().getLength() > 20) {
          poly2[i]=new google.maps.Polyline([polyline[i].getPath().getAt(lastVertex-1)]);
        }

    if (polyline[i].GetIndexAtDistance(d) < lastVertex+2) {
        if (poly2[i].getPath().getLength()>1) {
            poly2[i].getPath().removeAt(poly2[i].getPath().getLength()-1)
        }
            poly2[i].getPath().insertAt(poly2[i].getPath().getLength(),polyline[i].GetPointAtDistance(d));
    } else {
        poly2[i].getPath().insertAt(poly2[i].getPath().getLength(),endLocation[i].latlng);
    }
 }
//----------------------------------------------------------------------------

function animate(index,d) {
   if (d>eol[index]) {

      marker[index].setPosition(endLocation[index].latlng);
      marker[index].setOptions({zIndex: Math.round(endLocation[index].latlng.lat()*-100000)<<5});
      marker[index].setAnimation(google.maps.Animation.BOUNCE);
      // Prepare ship for next itenerary
      var midLoc = startLoc
      startLoc = endLoc
      endLoc = midLoc
      var Now =  new Date( new Date().getTime() + offset * 3600 * 1000).toUTCString().replace( / GMT$/, "" )
      for (var i = series.length - 1; i >= 0; i--) {
      // Difference to locate current position
       var Diff = Date.parse(Now) - Date.parse(series[i])
       // Determine Next Bac
       if (Diff > 0){
         CurrentBac = series[i+1]
        break
       }
      }
      var Diff = Date.parse(CurrentBac) - Date.parse(Now)
      timerHandle[index] = setTimeout("animate("+index+",0)", Diff);
      currentDistance[index]=0;
      // Stop animation after 10 seconds
      setTimeout("marker["+index+"].setAnimation()", 10000);
      console.log('Bac '+index+' arrivé à destination. Prochain départ dans '+(Diff/1000)+' secondes.')
      return;
   }
    var p = polyline[index].GetPointAtDistance(d);

    //map.panTo(p);
    marker[index].setPosition(p);
    marker[index].setOptions({zIndex: Math.round(p.lat()*-100000)<<5});
    updatePoly(index,d);
    timerHandle[index] = setTimeout("animate("+index+","+(d+Steps[index])+")", tick);
    currentDistance[index]=d+Steps[index];
    marker[index].setAnimation();
}

//-------------------------------------------------------------------------

function startAnimation(index, at ) {
        if (timerHandle[index]) clearTimeout(timerHandle[index]);
        eol[index]=polyline[index].Distance();
 
        map.setCenter(polyline[index].getPath().getAt(0));

        poly2[index] = new google.maps.Polyline({path: [polyline[index].getPath().getAt(0)], strokeColor:"#FFFF00", strokeWeight:3});

        timerHandle[index] = setTimeout("animate("+index+","+(at)+")",2000);  // Allow time for the initial map display
        currentDistance[index]=at;
        console.log('Bac '+index+' départ vers '+endLoc[index]+'.')

}

//----------------------------------------------------------------------------    
function stopAnimation(index) {
  clearTimeout(timerHandle[index]);
}

function continueAnimation(index) {
    d=currentDistance[index];
    timerHandle[index] = setTimeout("animate("+index+","+d+")", tick);
}

function generate_series(step) {
  var Now =  new Date( new Date().getTime() + offset * 3600 * 1000).toUTCString().replace( / GMT$/, "" )
  var today = new Date(Now)
  var i = 0
    var dt = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0),
        rc = [];
    while (dt.getDate() == today.getDate()) {
      if (i != 1 && i != 3 && i != 5 && i != 7 && i!=9){
        rc.push(dt.toLocaleString('en-US'));
           var Diff = Date.parse(Now) - Date.parse(dt.toLocaleString('en-US'))
           // Determine current Bac
           if (Diff <= 0 && NextBac == null){
             NextBac = dt.toLocaleString('en-US')
           }
      }
        dt.setMinutes(dt.getMinutes() + step);
        i++
    }

    return rc;
}