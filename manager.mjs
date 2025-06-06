"use strict";

/*
    This file is a module for ingesting API requests (jobs).
    It sends jobs to coolbeans to be completed by the worker module.
    I use the built-in http module instead of express or a similar framework
      for more control without the need to load middlewares and/or other modules.
*/

import http from 'node:http';

// create a server to ingest API requests
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(req.url);
    res.end();
})
// start the server
.listen(8080)
// acknowledge that the server has started
.on('listening', () => {
    console.info('http server started');
    console.debug('listening for API requests...');
})
// acknowledge that the server has stopped
.on('close', () => {
    console.info('http server stopped');
});
