"use strict";

/*
    This file is a module for ingesting API requests (jobs).
    It sends jobs to coolbeans to be completed by the worker module.
    I use the built-in http module instead of express or a similar framework
      for more control without the need to load middlewares and/or other modules.
*/

// load .env file into process.env
import "dotenv/config";

import http from 'node:http';
import querystring from "node:querystring";
import Jackd from "jackd";

// initalize the beanstalk client
const beanstalk = new Jackd();

// create a server to ingest API requests
http.createServer(function (req, res) {
    // respond to different HTTP verbs
    switch (req.method) {

        // get the details of a current job
        case 'GET':
            // this should first check the beanstalk client
            // if its not in the beanstalk queue, then check mongo
            console.log('got request');
            break;

        // create a new job
        case 'POST':
            // read post data as buffer
            const chunks = [];
            req.on('data', chunk => {
                chunks.push(chunk);
            });
            // reached end of post data
            req.on('end', () => {
                // do stuff with the data (in this case, use it as a payload)
                const payload = JSON.parse(chunks);
            });
            break;
    }
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
