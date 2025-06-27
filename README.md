# An Example Distributed System
This project implements a distributed, horizontally scalable distributed system.
Users can send jobs to a RESTful API (`manager.mjs`), and these jobs are inturn run on one or more workers (`worker.mjs`).
For demonstration purposes, the worker simply hashes the job's JSON payload and stores it in MongoDB, representing a completed job.
When pulling the status of a job, `manager.mjs` will first check beanstalkd for the jobs status. If the job is not found in the queue, `manager.mjs` will then
check MongoDB for a completed job, and it will return an appropriate HTML code and message depending on the job's presence in the database.

The system can be deployed on Docker Swarm to provide an easy, straightforward means of spawning additional worker processes.
Docker Swarm provides an easy-to-use means of deploying highly available applicationsm; Docker Compose files are used to deploy collections of services called "stacks".

The system includes a manager that handles API requests, and a worker that runs jobs deployed through this API. These two processes communicate through the beanstalk
protocol. Each job includes an ID and a payload.

## Utilites
- [Docker Swarm](https://github.com/dockerd/swarm) is a simple cluster management to deploy distributed applications.
- [beanstalkd](https://beanstalkd.github.io/) is a job/worker queue.
- [jackd](https://github.com/divmgl/jackd) is a beanstalk client that supports Node.JS
- [MongoDB](https://github.com/mongodb/mongo) a NoSQL database that will be used to store job outputs.
- [dotenv](https://github.com/motdotla/dotenv) allows the use of persistent environment variables.

## Local Setup
A local setup for development or testing purposes can be created with Docker. Two containers (one for beanstalkd and one for MongoDB) can be run on a local machine.
Each of the below commands can be run in its own terminal tab/window for the sake of ease. Basic scaling can be achieved by running more than one worker process.

To run beanstalkd:
```bash
docker run -it --rm -p 127.0.0.1:11300:11300 rayyounghong/beanstalkd -V
```

To run MongoDB:
```bash
docker run -it --rm -p 127.0.0.1:27017:27017 mongo
```

Start the manager:
```bash
node manager.mjs
```

Start one or more workers:
```bash
node worker.mjs
```

Send an example job:
```bash
curl -X POST localhost:8080 -H "Content-Type: application/json" --data '{"example":"data"}'
```

After sending an example job with cURL, the job's ID will be printed to the console. This ID can then be used to query the job's status:
```bash
curl localhost:8080/1/
```

If the job is waiting in the queue or in progress, the response to the GET request will reflect the details from beanstalkd, e.g.:
```json
{"id":1,"tube":"default","state":"reserved","pri":0,"age":0,"delay":0,"ttr":60,"timeLeft":59,"file":0,"reserves":1,"timeouts":0,"releases":0,"buries":0,"kicks":0}
```

If the job is complete, the response will be fetched from MongoDB, e.g.:
```json
{"_id":1,"hash":"09ee943c4fa33cd5a355eb7a4e38f7ef","payload":"{\"example\":\"data\"}"}
```

## Deployment
Easy scaling can be used in a production environment with Docker Swarm. In ordr to use Docker Swawm effectively, at least three Linux servers are required.
These can be either virtual or dedicated, and various Linux distributions can be used. Alias records should be pointed to each of the servers, and local hostnames
should match these DNS entries.

### Serer Setup
Docker Swarm distinguishes two types of servers: managers and workers. This nomenclature should not be confused with the usage of "managers" and "workers"
used in this project, although they are conceptually similar. Docker Swarm's managers are responsible for controlling the state of the swarm; managers in this
project add jobs to the queue. Managers in a Docker Swarm are also workers.

For this demo, we will use a single manager and two workers: `manager.edge-demo.site`, `worker-1.edge-demo.site` and `worker-2.edge-demo.site`.
 
To get up and running, install Docker on each of the servers via SSH:
```bash
curl -s https://get.docker.com | bash
```

#### Manager Node
In our setup, the Docker Swarm manager will be the only stateful node. It will be used to coordinate the swarm workers in addition to holding both the beastalkd
queue and MongoDB data.

One the manager node, initalize the swarm:
```bash
docker swarm init
```

The output will look like this:
```
Swarm initialized: current node (bvz81updecsj6wjz393c09vti) is now a manager.

To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-3pu6hszjas19xyp7ghgosyx9k8atbfcr8p2is99znpy26u2lkl-1awxwuwd3z9j1z3puu7rcgdbx 172.17.0.2:2377

To add a manager to this swarm, run 'docker swarm join-token manager' and follow the instructions.
```

#### Worker Nodes
The output of `docker swarm init` provides rudimentary instructions on joining a worker to the swarm; run this command on each worker to populate the swarm:
```bash
docker swarm join --token SWMTKN-1-3pu6hszjas19xyp7ghgosyx9k8atbfcr8p2is99znpy26u2lkl-1awxwuwd3z9j1z3puu7rcgdbx 172.17.0.2:2377
```

More information about [initializing a swarm](https://docs.docker.com/reference/cli/docker/swarm/init/) and 
[joining nodes](https://docs.docker.com/reference/cli/docker/swarm/join/) can be found in the official documentation.

### Controlling the Swarm
Managemnt of a Docker Swarm must (naturally) occur on a manager node, so log back in to the manager via SSH.

To check the setup of the swarm, run:
```bash
docker node ls
```

With one manager and two workers, the output should resemble the following:
```
ID                            HOSTNAME                  STATUS  AVAILABILITY   MANAGER STATUS   ENGINE VERSION
aZohnao5Eem2vafaeTh1ohgh5 *   manager.edge-demo.site    Ready   Active         Leader           25.0.3
saeSh9chue6aoqu1ahv3Mah1t     worker-1.edge-demo.site   Ready   Active                          25.0.3
Zoowou7een6aey9eici6Vaiz9     worker-2.edge-demo.site   Ready   Active                          25.0.3
```

### Running the Stack
Still on the manager node, download the Docker Compose file:
```bash
curl -s https://raw.githubusercontent.com/shcorya/distributed-workers/refs/heads/master/docker-compose.yml > docker-compose.yml
```

Note that the number of worker processes can be easily adjusted. The default is three.
```yaml
  worker:
    image: scorya/distributed-workers:development
    command: worker
    networks:
      - internal
    environment:
      <<: *connections
    deploy:
      mode: replicated
      replicas: 3 # <- adjust this to scale the number of workers
```

Deploy the stack:
```bash
docker stack deploy -c ./docker-compose.yml -d demo
```
