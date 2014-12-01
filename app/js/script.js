'use strict';

/* Globals */
var appVersion = 'v1.0.0';
var map, sidebarH, sidebarT;
var srcEPSG, canPerformTransformation;
var dstEPSG = '3765';
var showPointOnMap = true;
var centerMapOnPoint = true;
var markers = new L.FeatureGroup();

function setProj4Defs() {
  proj4.defs([
    [
      'EPSG:4326',
      '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees'],
    [
      'EPSG:3765',
      '+title=HTRS96/TM +proj=tmerc +lat_0=0 +lon_0=16.5 +k=0.9999 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'],
    [
      'EPSG:31275',
      '+title=Gauss–Krüger 5 zona +proj=tmerc +lat_0=0 +lon_0=15 +k=0.9999 +x_0=5500000 +y_0=0 +ellps=bessel +towgs84=550.499,164.116,475.142,5.80967,2.07902,-11.62386,0.99999445824 +units=m +no_defs'],
    [
      'EPSG:31276',
      '+title=Gauss–Krüger 6 zona +proj=tmerc +lat_0=0 +lon_0=18 +k=0.9999 +x_0=6500000 +y_0=0 +ellps=bessel +towgs84=550.499,164.116,475.142,5.80967,2.07902,-11.62386,0.99999445824 +units=m +no_defs'
    ]
  ]);
}

function doTransformation(srcCoordVal) {
  var srcPosition = {};
  var dstCoordObj = {};
  var pointLabel = '';
  var coorArray = [];
  try {
    var srcCoordArray = srcCoordVal.split(',');
    if (srcEPSG === '4326') {
      srcPosition.lng = srcCoordArray[1];
      srcPosition.lat = srcCoordArray[0];
    }
    else {
      srcPosition.lng = srcCoordArray[0];
      srcPosition.lat = srcCoordArray[1];
    }
    setProj4Defs();
    var dstCoordArray = proj4(proj4('EPSG:'+srcEPSG),proj4('EPSG:'+dstEPSG),[srcPosition.lng,srcPosition.lat]);
    setProj4Defs();
    var mapCoordArray = proj4(proj4('EPSG:'+srcEPSG),proj4('EPSG:4326'),[srcPosition.lng,srcPosition.lat]);
    dstCoordObj.lng = dstCoordArray[0];
    dstCoordObj.lat = dstCoordArray[1];
    if (showPointOnMap) {
      if (dstEPSG === '4326') {
        pointLabel = Math.round(srcPosition.lat*100)/100 + ', ' + Math.round(srcPosition.lng*100)/100 +
          '<br><span class="fa fa-arrow-down"></span><br>' +
          Math.round(dstCoordObj.lat*1000000)/1000000 + ', ' + Math.round(dstCoordObj.lng*1000000)/1000000;
        coorArray = [dstCoordObj.lat, dstCoordObj.lng];
      }
      else {
        pointLabel = Math.round(srcPosition.lng*100)/100 + ', ' + Math.round(srcPosition.lat*100)/100 +
          '<br><span class="fa fa-arrow-down"></span><br>' +
          Math.round(dstCoordObj.lng*100)/100 + ', ' + Math.round(dstCoordObj.lat*100)/100;
        coorArray = [dstCoordObj.lng, dstCoordObj.lat];
      }
      var marker = L.marker([mapCoordArray[1], mapCoordArray[0]]);
      marker.bindPopup(pointLabel);
      markers.addLayer(marker);
      marker.openPopup();
    }
    if (centerMapOnPoint) {
      map.panTo([mapCoordArray[1], mapCoordArray[0]]);
    }
    return dstCoordObj;
  } 
  catch(err) {
    console.log(err);
    return null;
  }
}

function throwError(greska) {
  canPerformTransformation = false;
  var el = $('errorMsg');
  el.update(greska);
  if (greska !== '&nbsp;') {
    ga('send', 'event', 'Error', greska);
  }
}

function goTransform() {
  var srcCoordEl = $('srcCoord');
  var dstCoor1El = $('dstCoord1');
  var dstCoor2El = $('dstCoord2');
  if (canPerformTransformation) {
    var srcCoordVal = srcCoordEl.value;
    if (srcCoordVal !== '') {
      var dstCoordObj = doTransformation(srcCoordVal);
      if (dstCoordObj !== null) {
        if (dstEPSG === '4326') {
          dstCoor1El.update('φ = ' + Math.round(dstCoordObj.lat*1000000)/1000000);
          dstCoor2El.update('λ = ' + Math.round(dstCoordObj.lng*1000000)/1000000); 
        }
        else {
          dstCoor1El.update('Y = ' + Math.round(dstCoordObj.lng*100)/100);
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

function goReset() {
  markers.clearLayers();
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
  if (this.id === 'oneCoordLink') { // jshint ignore:line
    ocEl.setStyle({
        display: 'inline',
        height: 'auto'
    });
    upEl.setStyle({
      display: 'none',
      height: 0
    });
  }
  else if (this.id === 'uploadLink') { // jshint ignore:line
    ocEl.setStyle({
      display: 'none',
      height: 0
    });
    upEl.setStyle({
        display: 'inline',
        height: 'auto'
    });
  }
  $('coordSystem').setStyle({
    display: 'inline'
  });
}

function toggleSettings() {
  var divEl = $('settings');
  if (divEl.getStyle('display') === 'none') {
    divEl.setStyle({
        display: 'inline',
        height: 'auto'
    });
  }
  else {
    divEl.setStyle({
      display: 'none',
      height: 0
    });
  }
}

function toggleCenter() {
  var el = $('buttonCenter');
  var ukljuceno = el.hasClassName('btn-success');
  if (ukljuceno) {
    el.toggleClassName('btn-success', false);
    el.toggleClassName('btn-danger', true);
    centerMapOnPoint = false;
  } else {
    el.toggleClassName('btn-success', true);
    el.toggleClassName('btn-danger', false);
    centerMapOnPoint = true;
  }
  ga('send', 'event', 'Tools', 'Toggle Center Map On Point');
}

function toggleMap() {
  var el = $('buttonMap');
  var ukljuceno = el.hasClassName('btn-success');
  if (ukljuceno) {
    el.toggleClassName('btn-success', false);
    el.toggleClassName('btn-danger', true);
    showPointOnMap = false;
    toggleCenter();
  } else {
    el.toggleClassName('btn-success', true);
    el.toggleClassName('btn-danger', false);
    showPointOnMap = true;

  }
  ga('send', 'event', 'Tools', 'Toggle Show Point On Map');
}

function csChanged() {
  var elCS = $('dstCS');
  var elCoord1 = $('dstCoord1');
  var elCoord2 = $('dstCoord2');
  var cs = $('dstCoord').value;
  elCS.update($('dstCoord').options[$('dstCoord').selectedIndex].innerHTML);
  if (cs === '4326') {
    elCoord1.update('φ = ');
    elCoord2.update('λ = ');
  }
  else {
    elCoord1.update('Y = ');
    elCoord2.update('X = ');
  }
  dstEPSG = cs;
}

function IsNumeric(input) {
  var RE = /^-{0,1}\d*\.{0,1}\d+$/;
  return (RE.test(input));
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

function analyseKeyInput(e) {
  throwError('&nbsp;');
  var srcCoord = $('srcCoord');
  if (srcCoord.value === 'Primjer: 45.16,16.45') {
    srcCoord.value = '';
  }
  else {
    canPerformTransformation = true;
    if (srcCoord.value.indexOf(',') > 1) {
      var elCS = $('srcCS');
      var elCoord1 = $('srcCoord1');
      var elCoord2 = $('srcCoord2');
      var polje = srcCoord.value.split(',');
      var lat = polje[0];
      var lon = polje[1];
      var cs = detectCS(lat);
      if (cs === 'WGS84') {
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
      else if (cs === 'HTRS96') {
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
      else if (cs === 'GK5') {
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
      else if (cs === 'GK6') {
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
    if (e.keyCode === 13) {
      goTransform();
    }
  }
}

function analyseMouseInput(e) {
  analyseKeyInput(e);
}

function CSVToArray(strData, strDelimiter) {
  strDelimiter = (strDelimiter || ',');
  var objPattern = new RegExp(("(\\" + strDelimiter + "|\\r?\\n|\\r|^)" + "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" + "([^\"\\" + strDelimiter + "\\r\\n]*))"),"gi"); // jshint ignore:line
  var arrData = [[]];
  var arrMatches = null;
  while (arrMatches = objPattern.exec( strData )) { // jshint ignore:line
    var strMatchedDelimiter = arrMatches[ 1 ];
    if (strMatchedDelimiter.length && (strMatchedDelimiter !== strDelimiter)) {
      arrData.push( [] );
    }
    var strMatchedValue;
    if (arrMatches[ 2 ]){
      strMatchedValue = arrMatches[ 2 ].replace(new RegExp( "\"\"", "g" ), "\""); // jshint ignore:line
    } 
    else {
      strMatchedValue = arrMatches[ 3 ];
    }
    arrData[ arrData.length - 1 ].push(strMatchedValue);
  }
  return(arrData);
}

function handleFileSelect(evt) {
  var file = evt.target.files[0]; 
  //if (file.type.match('text.*')) {
  var reader = new FileReader();
  reader.onload = (function() {
    return function(evt) {
      var parsedFile = [[]];
      try {
        var fileContent = evt.target.result;
        if (fileContent.indexOf('?xml') > 0) {
          var parser = new DOMParser();
          var xmlDoc = parser.parseFromString(fileContent, 'text/xml');
          var xmlCoords = xmlDoc.getElementsByTagName('trkpt');
          for (var i=0; i<xmlCoords.length; i++) {
            parsedFile[i].push(xmlCoords[i].attributes.lat.nodeValue);
            parsedFile[i].push(xmlCoords[i].attributes.lon.nodeValue);
            if (i+1 !== xmlCoords.length) {
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
        if (cs !== null) {
          var srcCoordVal = parsedFile[j][0] + ',' + parsedFile[j][1];
          var dstCoordObj = doTransformation(srcCoordVal);
          if (dstCoordObj !== null) {
            if (dstEPSG === '4326') {
              transformedFile[j].push(Math.round(dstCoordObj.lat*100)/100);
              transformedFile[j].push(Math.round(dstCoordObj.lng*100)/100);
            }
            else {
              transformedFile[j].push(Math.round(dstCoordObj.lng*100)/100);
              transformedFile[j].push(Math.round(dstCoordObj.lat*100)/100);
            }
            if (j+1 !== parsedFile.length) {
              transformedFile.push( [] );
            }
          }
        }
      }
      ga('send', 'event', 'Transform', 'EPSG:'+srcEPSG, 'EPSG:'+dstEPSG);
      if (centerMapOnPointHolder) {
        map.fitBounds(markers.getBounds());
      }
      centerMapOnPoint = centerMapOnPointHolder;
      var otuputList = '';
      for (var k=0; j<parsedFile.length; k++) {
        otuputList += parsedFile[k][0] + ', ' + parsedFile[k][1] + ' > ' + transformedFile[k][0] + ', ' + transformedFile[k][1] + '<br/>';
      }
      $('list').update(otuputList);
      var encodedUri = 'data:application/octet-stream,' + encodeURIComponent(transformedFile.join());
      var link = $('downloadCSV');
      link.setAttribute('href', encodedUri);
      link.setAttribute('onclick', 'ga("send", "event", "Tools", "Download CSV");');
      link.setAttribute('download', 'coordinates.csv');
      link.setStyle({
        display: 'block'
      });
    };
  })(file);
  reader.readAsText(file);
}

function pageInit() {
  /* App version */
  $('appversion').update(appVersion);
  /* Projections */
  setProj4Defs(); // proj4.defs parameterers are changing during execution of the code for some strange reason 
  /* Base Layers */
  var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>';
  var mbUrl = 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png';
  var streets  = L.tileLayer(mbUrl, {id: 'examples.map-i875mjb7',   attribution: mbAttr});
  /*var streets = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  });*/
  var dgu = L.tileLayer.wms('http://geoportal.dgu.hr/wms', {
    layers: 'DOF',
    format: 'image/png',
    attribution: '<a href="http://geoportal.dgu.hr/">DGU</a>'
  });
  var baseMaps = {
    'DGU ortofoto': dgu,
    'OpenStreetMap': streets
  };
  /* Map */
  map = L.map('map', {
    center: [44.5, 16.25],
    zoom: 7,
    layers: [dgu, streets]
  });
  map.addLayer(markers);
  /* Layer Control */
  L.control.layers(baseMaps, null, /*groupedOverlays,*/ {
    collapsed: true
  }).addTo(map);
  /* Sidebars */
  sidebarT = L.control.sidebar('sidebarT', {
    position: 'left'
  });
  map.addControl(sidebarT);
  sidebarH = L.control.sidebar('sidebarH', {
    position: 'right',
    autoPan: false
  });
  map.addControl(sidebarH);
  /* Buttons */
  L.easyButton('fa-calculator', 
    function (){
      sidebarT.toggle();
    },
    'Preračunavanje GPS koordinata u Gauss–Krüger'
  );
  setTimeout(function () {
    sidebarT.show();
  }, 500);
  L.easyButton('fa-info', 
    function (){
      sidebarH.toggle();
      ga('send', 'event', 'Tools', 'Toggle Info');
    },
    'Pomoć'
  );
  L.easyButton('fa-cog', 
    function (){
      if (!sidebarT.isVisible()) { sidebarT.show(); }
      toggleSettings();
      ga('send', 'event', 'Tools', 'Toggle Settings');
    },
    'Postavke'
  );
  /* Events */
  Event.observe('buttonTransform', 'click', goTransform);
  Event.observe('buttonReset', 'click', goReset);
  Event.observe('buttonMap', 'click', toggleMap);
  Event.observe('buttonCenter', 'click', toggleCenter);
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

Event.observe(window, 'load', pageInit);