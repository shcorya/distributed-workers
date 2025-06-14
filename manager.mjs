"use strict";

/*
    This file is a module for ingesting API requests (jobs).
    It sends jobs to coolbeans to be completed by the worker module.
    I use the built-in http module instead of express or a similar framework
      for more control without the need to load middlewares and/or other modules.
*/

// load .env file into process.env
import 'dotenv/config';

import http from 'node:http';
import querystring from "node:querystring";
import Jackd from "jackd";

// initalize the beanstalk client
const beanstalk = new Jackd({
    autoconnect: false,
    host: process.env.BEANSTALK_HOST || 'localhost',
    port: Number.parseInt(process.env.BEANSTALK_PORT) || 11300,
    maxReconnectAttempts: Number.parseInt(process.env.BEANSTALK_MAX_RECONNECT_ATTEMPTS) || 3
});
await beanstalk.connect();

// initialize the mongodb client, database, and collection
const mongo = new MongoClient(process.env.MONGO_URL || 'mongodb://localhost:27017');
await mongo.connect();
const db = mongo.db('jobs');
const completed = db.collection('completed');

// initialize id variable, used in both GET queries and POST http returns
let id = undefined;

// create a server to ingest API requests
http.createServer(function (req, res) {
    // respond to different HTTP verbs
    switch (req.method) {

        // get the details of a job
        case 'GET':
            // this should first check the beanstalk client
            // if its not in the beanstalk queue, then check mongo
            try {
                // extract the id as in integer from the url
                // GET api.example.com/123 -> 123
                id = Number.parseInt(req.url.split('/')[1]);
                // check beanstalk
                const jobStats = await beanstalk.statsJob(id);
                // return the job stats to the http client
                res.writeHead(200, {'Content-Type': 'application/json');
                res.write(JSON.stringify(jobStats));
                res.end();
            } catch (error) {
                // if the id is not found in beanstalk
                if (error.code === 'NOT_FOUND') {
                    // check mongodb for the same id
                    const jobResult = await completed.findOne({_id: id});
                    // check if the job was found in mongo, jobResult will be null if not found
                    if (jobResult) {
                         // write the result to the http response
                        res.writeHead(200, {'Content-Type': 'application/json');
                        res.write(JSON.stringify(jobResult));
                        res.end();
                    } else {
                        // job was not found in beanstalk or mongo, return 404
                        res.writeHead(404, {'Content-Type': 'text/html'});
                        res.write('404, job', id, 'not found');
                        res.end();
                    }
                } else {
                    // unhandled error, return code 500 (internal server error)
                    res.writeHead(500, {'Content-Type': 'text/html'});
                    // return helpful message to http client
                    res.write('internal server error, job', id, 'returned code', error.code);
                    res.end();
                }
            }
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
.listen(process.env.MANAGER_LISTEN_PORT || 8080)
// acknowledge that the server has started
.on('listening', () => {
    console.info('http server started');
    console.debug('listening for API requests...');
})
// acknowledge that the server has stopped
.on('close', () => {
    console.info('http server stopped');
});
