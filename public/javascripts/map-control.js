demo.clean = function() {
	$('#footprint-list ul').html('');
	if(demo.markerinfo !== undefined)  {
		for(i=0; i<demo.markerinfo.markers.length; i++) {
			demo.markerinfo.markers[i].setMap(null);
			google.maps.event.removeListener(demo.markerinfo.listeners[i]);
		}
		if(demo.markerinfo.line) {
			demo.markerinfo.line.setMap(null);
		}
	}
	if(demo.clusters !== undefined) {
		for(i=0; i<demo.clusters.length; i++) {
			demo.clusters[i].clearMarkers();
		}
	}
	if(demo.fmarkers !== undefined) {
		for(i=0; i<demo.fmarkers.length; i++) {
			demo.fmarkers[i].marker.setMap(null);
			demo.fmarkers[i].circle.setMap(null);
		}
	}
	$('#forecast-container').hide();
	$('#num-list-container').hide();
}
demo.footprint = function() {
	function printPath(r) {
		if(demo.markerinfo !== undefined)  {
			
			for(i=0; i<demo.markerinfo.markers.length; i++) {
				
				demo.markerinfo.markers[i].setMap(null);
				google.maps.event.removeListener(demo.markerinfo.listeners[i]);
			}
			if(demo.markerinfo.line) {
				demo.markerinfo.line.setMap(null);
			}
		}
		demo.markerinfo = {
				markers:[],
			    listeners:[],
			    line:{}
		};
		var path=[];
		for(i=0; i<r.length; i++) {
			path.push(new google.maps.LatLng(r[i].lat, r[i].lng));
		}
		for(i=0; i<path.length; i++) {
		  
		  var marker = new MarkerWithLabel({
	         position:path[i],
	         map: demo.map,
	         id: r[i].lastRetrieve,
	         labelContent: i,
	         
	         labelAnchor: new google.maps.Point(0, 0),
	         labelClass: "labels",
	         labelStyle: {opacity: 1.0},
	         labelInBackground: false
	      });
		  var infow = new google.maps.InfoWindow({content: new Date(r[i].lastRetrieve).toUTCString()});
		  demo.markerinfo.listeners.push(google.maps.event.addListener(marker, "click", function (e) { infow.open(demo.map, this); }));
		  demo.markerinfo.markers.push(marker);	 
		}
		var line = new google.maps.Polyline({
	          path: path,
	          strokeColor: '#ff0000',
	          strokeOpacity: 1.0,
	          strokeWeight: 3
	        });
	        line.setMap(demo.map);
	        demo.markerinfo.line = line;
	}
	$.get('/api/footprint').complete(function(data) {
		var objs = $.parseJSON(data.responseText); 
		if(objs) {
			$('#footprint-list ul').html('');
			$('#footprint-list').show();
			for(i=0 ; i<objs.length ; i++) {
				$('#footprint-list ul').append("<li class='option-list' id=vid-"+i+"><a href='#'>%s</a></li>".replace("%s", objs[i].name));
				(function(r) {
				  $('#vid-'+i).click(function(){			
					printPath(r.last10);
				  });
				})(objs[i]);
			}
		}
	});
}
demo.zone = function() {
	$.get('/api/zone').complete(function(data) {
		demo.clusters = demo.clusters || [];
		function makeClusterZone(r) {
			demo.markers = [];
			for(j=0; j<r.length; j++) {
				var marker = new google.maps.Marker({'position': new google.maps.LatLng(r[j].lat, r[j].lng)});
				demo.markers.push(marker);
			}
			var cluster = new MarkerClusterer(demo.map, demo.markers, { zoomOnClick: false });
			google.maps.event.addListener(cluster, 'clusterclick', function(c) {
				var content = '';
		   		var info = new google.maps.MVCObject();
		   		info.set('position', c.center_);
		   		
		   		var infowindow = new google.maps.InfoWindow();
		   		infowindow.close();
		   		infowindow.setContent("<div class='infobox'><h1>Client Notification</h1><textarea id='alert-msg' placeholder='Warning message to client' cols=36 rows=5></textarea><input type='submit' onclick='demo.sendAlert()' class='button' value='Send'></input></div>");
		 		infowindow.open(demo.map, info);	
			});
			demo.clusters.push(cluster);
		}
		var objs = $.parseJSON(data.responseText); 
		
		if(objs) {
			for(i=0 ; i<objs.length ; i++) {
			      
			      var list = objs[i].list
				  makeClusterZone(list);
				  
			}
		}
	});	
}
demo.forecast = function() {
	function animate(c, delay) {
		var or = c.getRadius();
		var enlarge = false;
		setInterval(function(){
			var r = c.getRadius();
			if(r <= 100000) {
				enlarge = true;
			} 
			if(r >= or) {
				enlarge=false;
			}
			if(enlarge) {
				c.setRadius(r*2);
			} else {
				c.setRadius(r/2);
			}
		}, delay);
	}
	
	function getCircle(m,f,s) {
//		  var circle = {
//		    path: google.maps.SymbolPath.CIRCLE,
//		    scale: m,
//		    strokeColor: "#FF0000",
//		    strokeWeight: 1,
//		    fillColor: '#AA0000';
//		  };
//		  return circle;
		  
		  var circle = new google.maps.Circle({
			  map: demo.map,
			  radius: m,    // metres
			  fillColor: f,
			  strokeColor: s,
			  strokeWeight: 1
			});
		  return circle;
	}
	
	function addInfow(m) {
		var content = '';
   		var info = new google.maps.MVCObject();
   		info.set('position', m.center_);
   		
   		var infowindow = new google.maps.InfoWindow();
   		infowindow.close();
   		infowindow.setContent("<div class='infobox'><h1>Client Notification</h1><textarea id='alert-msg' placeholder='Warning message to client' cols=36 rows=5></textarea><input type='submit' onclick='demo.sendAlert()' class='button' value='Send'></input></div>");
 		infowindow.open(demo.map, m);
 		console.log(infowindow);
	}
	
	function createForecast(r) {
		
		if(demo.fmarkers !== undefined)  {
			for(i=0; i<demo.fmarkers.length; i++) {
				demo.fmarkers[i].marker.setMap(null);
				demo.fmarkers[i].circle.setMap(null);
			}
		}
		
		demo.fmarkers = [];
		console.log(demo.fmarkers);		
		var hmarker = new google.maps.Marker({
			      position: new google.maps.LatLng(r.hLat, r.hLng),
			      map: demo.map,
	    });
		hcircle = getCircle(1200000, '#AA0000', "#FF0000"); 
		hcircle.bindTo('center', hmarker, 'position');
		animate(hcircle, 300);
	
		var mmarker = new google.maps.Marker({
		      position: new google.maps.LatLng(r.mLat, r.mLng),
		      map: demo.map,
		});
		mcircle = getCircle(700000, '#FFFFCC', "#FFFF00"); 
		mcircle.bindTo('center', mmarker, 'position');
		animate(mcircle, 400);
	
		var lmarker = new google.maps.Marker({
		      position: new google.maps.LatLng(r.lLat, r.lLng),
		      map: demo.map,
		});
		lcircle = getCircle(300000, '#7373DD', "#0011FF"); 
		lcircle.bindTo('center', lmarker, 'position');
		animate(lcircle, 650);
		google.maps.event.addListener(hmarker, 'click', function(c) {
			addInfow(hmarker);
		});
		google.maps.event.addListener(mmarker, 'click', function(c) {
			addInfow(mmarker);
		});		
		google.maps.event.addListener(lmarker, 'click', function(c) {
			addInfow(lmarker);
		});			
		demo.fmarkers.push({'marker':hmarker, 'circle': hcircle});
		demo.fmarkers.push({'marker':mmarker, 'circle': mcircle});
		demo.fmarkers.push({'marker':lmarker, 'circle': lcircle});
	}
	function ajaxCall(h,l) {
		$.get('/api/forecast', {"hours": h, "lmt":l}).complete(function(data) {
			var objs = $.parseJSON(data.responseText); 
			if(objs) {
				$('#footprint-list ul').html('');
				$('#footprint-list').show();
				for(i=0 ; i<objs.length ; i++) {
					$('#footprint-list ul').append("<li class='option-list' id=vid-"+i+"><a href='#'>%s</a></li>".replace("%s", objs[i].name));
					(function(r) {
					  $('#vid-'+i).click(function(){			
						  createForecast(r);
					  });
					})(objs[i]);
				}
			}
		});
	}
	$('#num-list').change(function(e) {
		
		ajaxCall($('#forecast-list').val(), $(this).val());
	});
	$('#forecast-list').change(function(e){
		ajaxCall($(this).val(), $('#num-list').val());
	});	
	ajaxCall(6, 5);
	$('#num-list-container').show();
	$('#forecast-container').show();
}
demo.sendAlert = function() {
	var msg = $('#alert-msg').val();
	console.log(demo.socket);
	demo.socket.send(msg);
	$('#alert-msg').val('');
}