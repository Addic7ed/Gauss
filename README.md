Gauss
=====

Web application that can be used for conversion of GPS coordinates from WGS84 to Gauss–Krüger projection and vice versa, with an accompanying map visualization.

## About

The tool is written in a pure JavaScript and is relaying on a two open sources projects: [Leaflet](http://leafletjs.com/) for cartography and [Proj4js](https://github.com/proj4js/proj4js) for actual transformation calculations. No server side scripts are used.

You can read more about the tool on my [blog](http://svemir.co/categories/tools/).

## Usage

The usage is simple; you enter two coordinates separated by comma and the tool will automatically recognize source coordinate system. The tool in this version supports only coordinate systems that are in use in Croatia (and Bosnia):
   * WGS84
   * HTRS96/TM
   * Gauss–Krüger zone 5
   * Gauss–Krüger zone 6

After the target coordinate system in which you want your coordinate to be transformed is selected, just press calculator button or hit enter, and your coordinate will be calculated and shown on the map. There are options to automatically zoom to the calculated coordinate, and to turn on or off display of the coordinates on the map all together. Also there is an option to switch base layer from Mapbox version of the OpenStreetMap to Digital Orthophoto that is provided by Croatian State Geodetic Administration.

## License
```
The MIT License (MIT)

Copyright (c) 2014 Tomislav Bacinger

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.