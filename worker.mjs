"use strict";

console.debug("worker module loaded");

import Jackd from "jackd";
import crypto from "node:crypto";

// initalize the beanstalk client
const beanstalk = new Jackd();

// run the primary funtion
work();

async function work() {
    // run in a loop
    while (true) {
        try {

            // get a job from the beanstalk queue
            const { id, payload } = await beanstalk.reserve();

            // hash the job's payload
            const hash = crypto.createHash('md5').update(JSON.stringify(payload)).digest('hex');

            // delay up to 5 seconds to simulate a long-running job
            await sleep(Math.floor(Math.random() * 5000));

            // delete the job (by its id) from the queue when it is done
            await beanstalk.delete(id);

        } catch (error) {
            // log the error for debugging
            console.error(error);
        }
    }
}

// used to simulate a delay in the work funtion
function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
