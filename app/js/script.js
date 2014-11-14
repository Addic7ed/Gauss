var map, pointLayer, srcEPSG, canPerformTransformation;
var dstEPSG = '3765';
var showPointOnMap = true;
var centerMapOnPoint = false;

function pageInit() {
	$('appversion').update('v0.9.2');
	map = new OpenLayers.Map({
		div: 'map',
		controls: [
			new OpenLayers.Control.Navigation(
				{dragPanOptions: {enableKinetic: true}}
			)
		],
		projection: new OpenLayers.Projection('EPSG:900913'),
		displayProjection: new OpenLayers.Projection('EPSG:3765')
	});	
	var layer = [
		new OpenLayers.Layer.OSM('OpenStreetMap'),
		new OpenLayers.Layer.WMS('DGU DOF', 'http://geoportal.dgu.hr/wms', {layers: 'DOF'}, {'isBaseLayer': true})
	];				
	map.addLayers(layer);	
	pointLayer = new OpenLayers.Layer.Vector('Tocka', {styleMap: new OpenLayers.StyleMap({'default':{externalGraphic:'images/marker.png', graphicWidth:16, graphicHeight:16, label:'${labela}', labelAlign:'lc', labelXOffset:10, fontWeight:'bold'}}),'displayInLayerSwitcher':false});
	map.addLayer(pointLayer);
	map.addControl(new OpenLayers.Control.MousePosition({numDigits: 0}));
	map.addControl(new OpenLayers.Control.PanZoomBar());
	map.addControl(new OpenLayers.Control.LayerSwitcher());
	map.controls.last().baseLbl.innerHTML = 'Podloge';
	var zoomBounds = new OpenLayers.Bounds(1406560, 5158900, 2150150, 5972167);
	map.zoomToExtent(zoomBounds);
	Event.observe('transformImg', 'click', goTransform);
	Event.observe('resetImg', 'click', goReset);
	Event.observe('infoImg', 'click', toggleInfo);
	Event.observe('settingsImg', 'click', toggleSettings);
	Event.observe('mapImg', 'click', toggleMap);
	Event.observe('centerImg', 'click', toggleCenter);
	Event.observe('srcCoord', 'keyup', analyseKeyInput);
	Event.observe('srcCoord', 'mouseup', analyseMouseInput);
	Event.observe('dstCoord', 'change', csChanged);
	if (window.File && window.FileReader && window.FileList ) {
		Event.observe('oneCoordLink', 'click', toggleInputMethod);
		Event.observe('uploadLink', 'click', toggleInputMethod);
		Event.observe('files', 'change', handleFileSelect);
	} else {
		$('uploadLink').setStyle({
			display: 'none'
		});	  
		$('oneCoord').setStyle({
			display: 'inline'
		});	  
	}
}

function goTransform() {
	var srcCoordEl = $('srcCoord');
	var dstCoor1El = $('dstCoord1');
	var dstCoor2El = $('dstCoord2');
	if (canPerformTransformation) {
		var srcCoordVal = srcCoordEl.value;
		if (srcCoordVal != '') {
			var dstCoordObj = doTransformation(srcCoordVal);
			if (dstCoordObj != null) {
				if (dstEPSG == '4326') {
					dstCoor1El.update('φ = ' + Math.round(dstCoordObj.lat*100)/100);
					dstCoor2El.update('λ = ' + Math.round(dstCoordObj.lon*100)/100); 
				}
				else {
					dstCoor1El.update('Y = ' + Math.round(dstCoordObj.lon*100)/100);
					dstCoor2El.update('X = ' + Math.round(dstCoordObj.lat*100)/100); 
				}
				ga('send', 'event', 'Transform', 'Single point');
				ga('send', 'event', 'Transform', 'EPSG:'+srcEPSG, 'EPSG:'+dstEPSG);
			}
			else {
				throwError('Preračunavanje koordinata nije uspjelo');
			}
		}
		else {
			throwError('Nisu unešene koordinate');
		}
	}
}

function doTransformation(srcCoordVal) {
	var pointLabel;
	var srcPosition;
	var mapPosition;
	try {
		var srcCoordArray = srcCoordVal.split(',');
		if (srcEPSG == '4326') {
			srcPosition = new OpenLayers.LonLat(srcCoordArray[1], srcCoordArray[0]);
			mapPosition = new OpenLayers.LonLat(srcCoordArray[1], srcCoordArray[0]);
		}
		else {
			srcPosition = new OpenLayers.LonLat(srcCoordArray[0], srcCoordArray[1]);
			mapPosition = new OpenLayers.LonLat(srcCoordArray[0], srcCoordArray[1]);
		}
		var dstCoordObj = srcPosition.transform(new OpenLayers.Projection('EPSG:'+srcEPSG), new OpenLayers.Projection('EPSG:'+dstEPSG));
		var mapCoord = mapPosition.transform(new OpenLayers.Projection('EPSG:'+srcEPSG), map.getProjectionObject());
		if (showPointOnMap) {
			if (dstEPSG == '4326') {
				pointLabel = Math.round(dstCoordObj.lat*100)/100 + ', ' + Math.round(dstCoordObj.lon*100)/100;
			}
			else {
				pointLabel = Math.round(dstCoordObj.lon*100)/100 + ', ' + Math.round(dstCoordObj.lat*100)/100;
			}
			drawPoint(mapCoord.lon, mapCoord.lat, {labela:pointLabel}, pointLayer);
		}
		if (centerMapOnPoint) {
			map.setCenter(mapCoord, 15);
		}
		return dstCoordObj;
	} 
	catch(err) {
		return null;
	}
}

function drawPoint(x,y,attributes,layer,style) {
	var point = new OpenLayers.Geometry.Point(x,y);	
	var pointFeature =  new OpenLayers.Feature.Vector(point,null,style);
	pointFeature.attributes = attributes;	
	layer.addFeatures([pointFeature]);
}

function goReset() {
	pointLayer.destroyFeatures();
	$('srcCoord').value = '';
	$('srcCS').update();
	$('srcCoord1').update();
	$('srcCoord2').update();
	$('dstCoord1').update();
	$('dstCoord2').update();
}

function toggleInputMethod() {
	var ocEl = $('oneCoord');
	var upEl = $('upload');
	if (this.id == 'oneCoordLink') {
		ocEl.setStyle({
				display: 'inline',
				height: 'auto'
		});
		upEl.setStyle({
			display: 'none',
			height: 0
		});
	}
	else if (this.id == 'uploadLink') {
		ocEl.setStyle({
			display: 'none',
			height: 0
		});
		upEl.setStyle({
				display: 'inline',
				height: 'auto'
		});
	}
}

function toggleInfo() {
	var divEl = $('info');
	if (divEl.getStyle('visibility') == 'hidden') {
		divEl.setStyle({
				visibility: 'visible',
				height: 'auto'
		});
		ga('send', 'event', 'Tools', 'Show Info');
	}
	else {
		divEl.setStyle({
			visibility: 'hidden',
			height: 0
		});
	}
}

function toggleSettings() {
	var divEl = $('settings');
	if (divEl.getStyle('display') == 'none') {
		divEl.setStyle({
				display: 'inline',
				height: 'auto'
		});
		ga('send', 'event', 'Tools', 'Show Settings');
	}
	else {
		divEl.setStyle({
			display: 'none',
			height: 0
		});
	}
}

function toggleMap() {
	var imgEl = $('mapImg');
	if (imgEl.src.indexOf('off') > 0) {
		imgEl.src = imgEl.src.replace('off','on');
		showPointOnMap = true;
	}
	else {
		imgEl.src = imgEl.src.replace('on','off');
		showPointOnMap = false;
		imgEl =  $('centerImg');
		imgEl.src = imgEl.src.replace('on','off');
		centerMapOnPoint = false;
		ga('send', 'event', 'Tools', 'Show Point On Map');
	}
}

function toggleCenter() {
	var imgEl = $('mapImg');
	if (imgEl.src.indexOf('on') > 0) {
		imgEl = $('centerImg');
		if (imgEl.src.indexOf('off') > 0) {
			imgEl.src = imgEl.src.replace('off','on');
			centerMapOnPoint = true;
			ga('send', 'event', 'Tools', 'Center Map On Point');
		}
		else {
			imgEl.src = imgEl.src.replace('on','off');
			centerMapOnPoint = false;
		}
	}
}

function csChanged() {
	var elCS = $('dstCS');
	var elCoord1 = $('dstCoord1');
	var elCoord2 = $('dstCoord2');
	var cs = $('dstCoord').value;
	elCS.update($('dstCoord').options[$('dstCoord').selectedIndex].innerHTML);
	if (cs == '4326') {
		elCoord1.update('φ = ');
		elCoord2.update('λ = ');
	}
	else {
		elCoord1.update('Y = ');
		elCoord2.update('X = ');
	}
	dstEPSG = cs;
}

function analyseMouseInput(e) {
	analyseKeyInput(e);
}

function analyseKeyInput(e) {
	throwError('&nbsp;');
	var srcCoord = $('srcCoord');
	if (srcCoord.value == 'Primjer: 45.16,16.45') {
		srcCoord.value = '';
	}
	else {
		canPerformTransformation = true;
		if (srcCoord.value.indexOf(',') > 1) {
			var elCS = $('srcCS');
			var elCoord1 = $('srcCoord1');
			var elCoord2 = $('srcCoord2');
			var polje = srcCoord.value.split(',');
			var lenCoord = 0;
			var lat = polje[0];
			var lon = polje[1];
			var cs = detectCS(lat);
			if (cs == 'WGS84') {
				elCS.update('WGS84');
				elCoord1.update('φ = ');
				elCoord2.update('λ = ');
				if (IsNumeric(lat)) {
					elCoord1.update(elCoord1.innerHTML + lat);
				}
				if (!isWGS84Lon(lon)) {
					canPerformTransformation = false;
					if (lon.length > 0) {
						throwError('Druga koordinata je pogrešna');
					}
				}
				else {
					if (IsNumeric(lon)) {
						elCoord2.update(elCoord2.innerHTML + lon);
					}
				}
			}
			else if (cs == 'HTRS96') {
				elCS.update('HTRS96');
				elCoord1.update('Y = ');
				elCoord2.update('X = ');
				if (IsNumeric(lat)) {
					elCoord1.update(elCoord1.innerHTML + lat);
				}
				if (!isGK(lon)) {
					canPerformTransformation = false;
					if (lon.length > 6) {
						throwError('Druga koordinata je pogrešna');
					}
				}
				else {
					if (IsNumeric(lon)) {
						elCoord2.update(elCoord2.innerHTML + lon);
					}
				}
			}
			else if (cs == 'GK5') {
				elCS.update('GK5');
				elCoord1.update('Y = ');
				elCoord2.update('X = ');
				if (IsNumeric(lat)) {
					elCoord1.update(elCoord1.innerHTML + lat);
				}
				if (!isGK(lon)) {
					canPerformTransformation = false;
					if (lon.length > 6) {
						throwError('Druga koordinata je pogrešna');
					}
				}
				else {
					if (IsNumeric(lon)) {
						elCoord2.update(elCoord2.innerHTML + lon);
					}
				}
			}
			else if (cs == 'GK6') {
				elCS.update('GK6');
				elCoord1.update('Y = ');
				elCoord2.update('X = ');
				if (IsNumeric(lat)) {
					elCoord1.update(elCoord1.innerHTML + lat);
				}
				if (!isGK(lon)) {
					canPerformTransformation = false;
					if (lon.length > 6) {
						throwError('Druga koordinata je pogrešna');
					}
				}
				else {
					if (IsNumeric(lon)) {
						elCoord2.update(elCoord2.innerHTML + lon);
					}
				}
			}
			else {
				throwError('Ne prepoznajem koordinatni sustav');
			}
		}
		if (e.keyCode==13) {
			goTransform();
		}
	}
}

function detectCS(test) {
	if (isWGS84Lat(test)) {
		srcEPSG = '4326';
		return 'WGS84';
	}
	else if (isHTRS96(test)) {
		srcEPSG = '3765';
		return 'HTRS96';
	}
	else if (isGK5(test)) {
		srcEPSG = '31275';
		return 'GK5';
	}
	else if (isGK6(test)) {
		srcEPSG = '31276';
		return 'GK6';
	}
	else {
		srcEPSG = null;
		return 'nonCS';
	}
}

function isWGS84Lat(input) {
	var RE = /(^\+?([1-8])?\d(\.\d+)?$)|(^-90$)|(^-(([1-8])?\d(\.\d+)?$))/;
	return (RE.test(input));
}

function isWGS84Lon(input) {
	var RE = /(^\+?1[0-7]\d(\.\d+)?$)|(^\+?([1-9])?\d(\.\d+)?$)|(^-180$)|(^-1[1-7]\d(\.\d+)?$)|(^-[1-9]\d(\.\d+)?$)|(^\-\d(\.\d+)?$)/;
	return (RE.test(input));
}

function isHTRS96(input) {
	var RE = /^[+]?[0-9]{6}(?:\.[0-9]{1,6})?$/;
	return (RE.test(input));
}

function isGK5(input) {
	var RE = /^[5][0-9]{6}(?:\.[0-9]{1,6})?$/;
	return (RE.test(input));
}

function isGK6(input) {
	var RE = /^[6][0-9]{6}(?:\.[0-9]{1,6})?$/;
	return (RE.test(input));
}

function isGK(input) {
	var RE = /^[+]?[0-9]{7}(?:\.[0-9]{1,6})?$/;
	return (RE.test(input));
}

function handleFileSelect(evt) {
	var file = evt.target.files[0]; 
	//if (file.type.match('text.*')) {
	var reader = new FileReader();
	reader.onload = (function(theFile) {
		return function(evt) {
			var parsedFile = [[]];
			try {
				var fileContent = evt.target.result;
				if (fileContent.indexOf('?xml') > 0) {
					var parser = new DOMParser();
					var xmlDoc = parser.parseFromString(fileContent, 'text/xml');		
					var xmlCoords = xmlDoc.getElementsByTagName('trkpt');
					for (var i=0; i<xmlCoords.length; i++) {
						parsedFile[i].push(xmlCoords[i].attributes['lat'].nodeValue);
						parsedFile[i].push(xmlCoords[i].attributes['lon'].nodeValue);
						if (i+1 != xmlCoords.length) {
							parsedFile.push( [] );
						}
					}
					ga('send', 'event', 'Transform', 'GPX');
				}
				else {
					parsedFile = CSVToArray(fileContent, ',');
					ga('send', 'event', 'Transform', 'CSV');
				}
			} catch(err) {}
			var transformedFile = [[]];
			var centerMapOnPointHolder = centerMapOnPoint;
			centerMapOnPoint = false;
			for (var j=0; j<parsedFile.length; j++) {
				var cs = detectCS(parsedFile[j][0]);
				if (cs != null) {
					var srcCoordVal = parsedFile[j][0] + ',' + parsedFile[j][1];
					var dstCoordObj = doTransformation(srcCoordVal);
					if (dstCoordObj != null) {
						if (dstEPSG == '4326') {
							transformedFile[j].push(Math.round(dstCoordObj.lat*100)/100);
							transformedFile[j].push(Math.round(dstCoordObj.lon*100)/100);
						}
						else {
							transformedFile[j].push(Math.round(dstCoordObj.lon*100)/100);
							transformedFile[j].push(Math.round(dstCoordObj.lat*100)/100);
						}
						if (j+1 != parsedFile.length) {
							transformedFile.push( [] );
						}
					}
				}
			}
			ga('send', 'event', 'Transform', 'EPSG:'+srcEPSG, 'EPSG:'+dstEPSG);
			if (centerMapOnPointHolder) {
				map.zoomToExtent(pointLayer.getDataExtent());
			}
			centerMapOnPoint = centerMapOnPointHolder;
			var otuputList = '';
			for (var j=0; j<parsedFile.length; j++) {
				otuputList += parsedFile[j][0] + ', ' + parsedFile[j][1] + ' > ' + transformedFile[j][0] + ', ' + transformedFile[j][1] + '<br/>';
			}
			$('list').update(otuputList);
			var encodedUri = "data:application/octet-stream," + encodeURIComponent(transformedFile.join());
			var link = $('downloadCSV');
			link.setAttribute('href', encodedUri);
			link.setAttribute('onclick', "ga('send', 'event', 'Tools', 'Download CSV');");
			link.setAttribute('download', 'coordinates.csv');
			link.setStyle({
				display: 'inline'
			});
		};
	})(file);
	reader.readAsText(file);
}


function throwError(greska) {
	canPerformTransformation = false;
	var el = $('errorMsg');
	el.update(greska);
	if (greska != '&nbsp;') {
		ga('send', 'event', 'Error', greska);
	}
}

function IsNumeric(input) {
	var RE = /^-{0,1}\d*\.{0,1}\d+$/;
	return (RE.test(input));
}

function CSVToArray(strData, strDelimiter) {
	strDelimiter = (strDelimiter || ",");
	var objPattern = new RegExp(("(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +	"(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +	"([^\"\\" + strDelimiter + "\\r\\n]*))"),"gi");
	var arrData = [[]];
	var arrMatches = null;
	while (arrMatches = objPattern.exec( strData )) {
		var strMatchedDelimiter = arrMatches[ 1 ];
		if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {
			arrData.push( [] );
		}
		if (arrMatches[ 2 ]){
			var strMatchedValue = arrMatches[ 2 ].replace(new RegExp( "\"\"", "g" ), "\"");
		} 
		else {
			var strMatchedValue = arrMatches[ 3 ];
		}
		arrData[ arrData.length - 1 ].push(strMatchedValue);
	}
	return(arrData);
}

Event.observe(window, 'load', pageInit);		