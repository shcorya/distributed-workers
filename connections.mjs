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

export { beanstalk, completed };
