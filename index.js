var express = require('express'),
	exphbs  = require('express3-handlebars'),
	util = require('./assets/util'),
	path = require('path'),
	busboy = require('connect-busboy'),
	app = express();

var coordinates = []; /* Array that will hold coordinates for each image/video */

// Set view rendering engine
app.engine('html', exphbs());

app.use('/assets', express.static(path.basename('/assets')));
app.use(busboy({immediate: true}));

// Routing
app.get('/', home);
app.get('/coords', getCoords);
app.post('/', showMap);

function home(req, res) {
	res.render('home.html');
}

function getCoords(req, res) {
	res.json(coordinates);
}

function showMap(req, res) {
	util.readData(req, function(coords) {
		coordinates = coords;
		res.render('map.html');
	});
}

// Start application
app.listen(3000);
console.log('App started at port 3000');