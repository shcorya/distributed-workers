"use strict";

// load .env file into process.env
import "dotenv/config";

import Jackd from "jackd";
import crypto from "node:crypto";
import { MongoClient } from "mongodb";

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

// run the primary funtion
work();

async function work() {
    // run in a loop
    while (true) {

        // get a job from the beanstalk queue
        const { id, payload } = await beanstalk.reserve();

        // hash the job's payload
        const hash = crypto.createHash('md5').update(JSON.stringify(payload)).digest('hex');

        // delay up to 5 seconds to simulate a long-running job
        await sleep(Math.floor(Math.random() * 5000));

        // add the completed job to mongodb by its beanstalk id
        await completed.insertOne({_id: id, hash, payload});

        // delete the job (by its id) from the queue when it is done and added to mongodb
        await beanstalk.delete(id);

    }
}

// used to simulate a delay in the work funtion
function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
