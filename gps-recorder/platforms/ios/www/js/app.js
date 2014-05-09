function App() {
    var pub = {},
        source = undefined,
        coords = [],
        results = undefined,
        error = undefined,
        watchId = undefined;

    pub.init = function() {
        bindEvents();
        handlebarsHelpers();
    }

    function bindEvents() {
        document.addEventListener('deviceready', onDeviceReady, false);
        $('#save').bind('click', onClickSave);
        $('#start').bind('click', onClickStart);
        $('#single').bind('click', onClickGetPosition);
    }

    function handlebarsHelpers() {
        Handlebars.registerHelper('convertAlt', function(alt) {
            return Math.round(alt * 3.28084);
        });

        Handlebars.registerHelper('convertSpeed', function(speed) {
            return Math.round(speed * 2.23694);
        });

        Handlebars.registerHelper('roundNum', function(num) {
            return Math.round(num * 1000) / 1000;
        })
    }

    // When PhoneGap declares the app ready
    function onDeviceReady() {
        source = $('#gps-template').html();
        results = $('#results');
        error = $('#error');
    }

    // Launches geolocation
    function onClickGetPosition() {
        navigator.geolocation.getCurrentPosition(onGPSPositionSuccess, onGPSError);
    }

    // Launches geolocation watcher, is a toggle button
    function onClickStart() {
        var text = '';

        if(!$(this).hasClass('started')) {
            watchId = navigator.geolocation.watchPosition(onGPSWatchSuccess, onGPSError, {
                maximumAge: 1000,
                enableHighAccuracy: true,
                timeout: 1000
            });
            coords = [];
            text = 'Stop Tracking';
        } else {
            navigator.geolocation.clearWatch(watchId);
            text = 'Start Tracking';
        }

        $(this).toggleClass('started').text(text);
    }

    // Starts process of requesting file system access to save and email coordinates
    function onClickSave() {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 5*1024*1024, onInitFS, onFSRequestError);
    }

    // Tracks user position every second
    function onGPSWatchSuccess(position) {
        saveCoords(position, true);
    }

    // Gets users position (no tracking)
    function onGPSPositionSuccess(position) {
        saveCoords(position, false);
    }

    // Saves coordinates object to file system and emails to user
    function onInitFS(fs) {
        var date = new Date(),
            name = 'gpslog-' + date.getFullYear() + (date.getMonth()+1) + date.getDate() + date.getHours() + date.getMinutes() + date.getSeconds() + '.json';
        fs.root.getFile(name, {create: true}, function(fileEntry) {
            fileEntry.createWriter(function(fileWriter) {
                var json = JSON.stringify(coords);
                var blob = new Blob([json], {type: 'text/json'});
                fileWriter.write(blob);

                fileWriter.onerror = function(err) {
                    alert('Write error');
                };

                fileWriter.onwriteend = function() {
                    alert('File saved');
                };
            });
        });
    }

    // Error callbacks
    function onGPSError(err) {
        if(err.code !== 3)
            alert('There was an error getting your position.');
    }

    function onFSRequestError(err) {
        alert('There was an error trying to access your file system');
    }

    /* Displays coordinates on page and if tracking, saves them to array */
    function saveCoords(position, tracking) {
        var tempObj = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            alt: position.coords.altitude,
            speed: position.coords.speed,
            heading: position.coords.speed,
            timestamp: position.timestamp
        };
        
        if(tracking) coords.push(tempObj);

        var template = Handlebars.compile(source);
        var html = template(tempObj);
        results.html(html);
    }

    return pub;
}

var app = new App();
app.init();