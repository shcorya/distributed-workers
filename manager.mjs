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
import { MongoClient } from "mongodb";

// initalize the beanstalk client
const beanstalk = new Jackd({
    autoconnect: false,
    host: process.env.BEANSTALK_HOST || '127.0.0.1',
    port: Number.parseInt(process.env.BEANSTALK_PORT) || 11300
});
await beanstalk.connect();

// initialize the mongodb client, database, and collection
const mongo = new MongoClient(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017');
await mongo.connect();
const db = mongo.db('jobs');
const completed = db.collection('completed');

// initialize id variable, used in both GET queries and POST http returns
let id = undefined;

// create a server to ingest API requests
http.createServer(async function (req, res) {
    // respond to different HTTP verbs
    switch (req.method) {

        // get the details of a job
        case 'GET':
            // log request to stdout
            console.debug('received GET request at path', req.url);
            // this should first check the beanstalk client
            // if its not in the beanstalk queue, then check mongo
            try {
                // extract the id as in integer from the url
                // GET api.example.com/123 -> 123
                id = Number.parseInt(req.url.split('/')[1]);
                // check beanstalk for the job
                const jobStats = await beanstalk.statsJob(id);
                // print to console in addition to returning HTTP
                console.debug('returning stats for job', id, '...');
                // return the job stats to the http client
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                });
                res.write(`${JSON.stringify(jobStats)}\r\n`);
                res.end();
            } catch (error) {
                // if the id is not found in beanstalk
                if (error.code === 'NOT_FOUND') {
                    // check mongodb for the same id
                    const jobResult = await completed.findOne({_id: id});
                    // check if the job was found in mongo, jobResult will be null if not found
                    if (jobResult) {
                        // print to console in addition to returning HTTP
                        console.debug('returning job result for job', id, '...');
                        // write the result to the http response
                        res.writeHead(200, {
                            'Content-Type': 'application/json',
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                        });
                        res.write(`${JSON.stringify(jobResult)}\r\n`);
                        res.end();
                    } else {
                        // print to console in addition to returning HTTP
                        console.debug('job', id, 'not found');
                        // job was not found in beanstalk or mongo, return 404
                        res.writeHead(404, {
                            'Content-Type': 'text/html',
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache',
                            'Expires': '0'
                         });
                        res.write(`404, job ${id} not found\r\n`);
                        res.end();
                    }
                } else {
                    // unhandled error, return code 500 (internal server error)
                    // print to console
                    console.log('internal server error');
                    // return HTTP
                    res.writeHead(500, {
                        'Content-Type': 'text/html',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    });
                    // return helpful message to HTTP client
                    res.write(`internal server error, job ${id} returned ${error.code}\r\n`);
                    res.end();
                }
            }
            break;

        // create a new job
        case 'POST':
            // log request to stdout
            console.debug('received POST request at path', req.url);
            // declare the payload variable, will be passed to beanstalk
            let payload = undefined;
            // read post data as buffer
            const chunks = [];
            req.on('data', chunk => {
                chunks.push(chunk);
            });
            // reached end of post data
            req.on('end', async () => {
                // do stuff with the data (in this case, use it as a payload)
                try {
                    // try parsing the payload as JSON
                    payload = JSON.parse(chunks);
                    // print the payload to the console
                    console.debug('received new job with payload', payload);
                // if the payload is not valid JSON
                } catch (error) {
                    // error 400 -> bad request
                    // print to console
                    console.debug('bad request (invalid JSON payload)');
                    // respond to HTTP client
                    response.writeHead(400, {'ContentType': 'text/html'});
                    response.write(`received data is not valid JSON\r\n`);
                    res.end();
                    // exit execution of this function after a bad request
                    return 400;
                }
                // add the JSON received from http POST request to beanstalk as a new job
                id = await beanstalk.put(payload);
                // return success to http client
                res.writeHead(200, {'ContentType': 'text/html'});
                // respond with a message including the new job's id
                res.write(`added job ${id} to queue\r\n`);
                res.end();
                // write the same message to the console
                console.debug('added job', id, 'to queue');
            });
            break;
        // received http verb is neither GET or POST
        default:
            // http 405 -> method not allowed
            // print to console
            console.debug('method', req.method, 'not allowed');
            // respond to HTTP client
            response.writeHead(405, {'ContentType': 'text/html'});
            response.write(`method ${req.method} is not allowed\r\n`);
            res.end();
    }
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
