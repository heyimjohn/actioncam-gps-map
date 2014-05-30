var busboy = require('connect-busboy'),
	fs = require('fs'),
	os = require('os'),
	path = require('path'),
	csv = require('csv');

var coords = [], /* Array that will hold coordinates for each image/video */
	minVelocity = 40, /* Min velocity (knots) for coordinate to be recorded */
	interval = 5;

var readData = function(req, cb) {
	/* Saves file to uploads folder */
	req.busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		var rootDir = path.dirname(require.main.filename);
        var uploadDir = 'uploads';
        var saveTo = path.join(rootDir, uploadDir);
		saveTo = path.join(saveTo, path.basename(filename));
        file.pipe(fs.createWriteStream(saveTo));

        if(mimetype === 'application/json') {
        	fs.readFile(saveTo, 'utf-8', function(err, data) {
        		data = JSON.parse(data);
        		console.log('There are ' + data.length + ' coordinates in this log.');

        		for(var i=0; i<data.length; i++) {
        			if(i % interval === 0) {
	        			coords.push({
		        			speed: data[i].speed,
		        			lat: data[i].lat,
		        			lng: data[i].lng,
		        			altitude: data[i].alt,
		        			type: 'iphone'
		        		});
		        	}
        		}

        		console.log('Only ' + coords.length + ' proccessed.');
        		cb(coords);
        	});
        } else {
	        /* Now lets read the log, which is a CSV file */
	        csv()
	        .from(saveTo, {comment: '@'})
	        .to.array(function(rows) {
	        	console.log('There are ' + rows.length + ' coordinates in this log.');
	        	coords = [];
	        	var lat, lon, 
	        		filteredData = rows.filter(utils.filterGPSData);

	        	/* After reading CSV and transforming data into a giant array, loop through array and save coordinates */
	        	for(var i=0; i<filteredData.length; i++) {
	        		if(i % interval === 0) {
		        		lat = filteredData[i][3] === 'N' ? filteredData[i][2] : filteredData[i][3];
		        		lon = filteredData[i][5] === 'W' ? filteredData[i][4] : filteredData[i][5];
		        		coords.push({
		        			speed: filteredData[i][7],
		        			lat: utils.convertToLatLng(lat, 'lat'),
		        			lng: utils.convertToLatLng(lon, 'lng'),
		        			type: 'actioncam'
		        		});
		        	}
	        	}

	        	console.log('Only ' + coords.length + ' proccessed.');
	        })
	        .on('end', function() {
	        	cb(coords);
	        });
		}
	});
}

// In the following function, we need to convert degrees to actual lat/lon coordinates for google maps
 function convertToLatLng(coord, type) {
	var degrees = parseInt(coord.substr(0, 2)),
		min = coord.substr(2, 2),
		sec = coord.substr(4) * 60,
		latlng = 0;

	latlng = degrees + ((min/60) + (sec/3600));

	if(type === 'lng') latlng = -latlng;

	return latlng;
}

// Make sure coordinate was recorded at a velocity faster than minVelocity
function filterGPSData(element, i, arr) {
	if(i === 0 || i === (arr.length - 1)) return element;

	if(element[0] === '$GPRMC') {
		if(element[7] > minVelocity) {
			return element;
		}
	}
}

module.exports.readData = readData;