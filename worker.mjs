"use strict";

// load .env file into process.env
import "dotenv/config";

import crypto from "node:crypto";
import { beanstalk, completed } from "./connections.mjs";

// run the primary funtion
work();

async function work() {
    // indicate that the worker has started
    console.info('worker started');
    console.debug('watching for jobs...');

    // run in a loop
    while (true) {

        // get a job from the beanstalk queue
        const { id, payload } = await beanstalk.reserve();

        // get a timestamp at the start of the job processing
        const startTime = Date.now();

        // hash the job's payload to simulate work
        const hash = crypto.createHash('md5').update(JSON.stringify(payload)).digest('hex');

        // delay between 1 and 5 seconds to simulate a long-running job
        await sleep(1000 + Math.floor(Math.random() * 4000));

        // add the completed job to mongodb by its beanstalk id
        await completed.insertOne({_id: id, hash, payload});

        // delete the job (by its id) from the queue when it is done and added to mongodb
        await beanstalk.delete(id);

        // print the time elapsed since the job started to the console
        console.debug('successfully processed job', id, 'in', (Date.now() - startTime) / 1000, 'seconds');

    }
}

// used to simulate a delay in the work funtion
function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
