# An Example Distributed System
This project implements a distributed, horizontally scalable distributed system.
Users can send jobs to a RESTful API, and these jobs are inturn run on one or more workers.
For demonstration purposes, the worker simply generates a timestamp and stores it in MongoDB, representing a completed job.

The system can be deployed on Docker Swarm to provide an easy, straightforward means of spawning additional worker processes.
Docker Swarm provides an easy-to-use means of deploying highly available applicationsm; Docker Compose files are used to deploy collections of services called "stacks".

## Utilites
- [Docker Swarm](https://github.com/dockerd/swarm) is a simple cluster management to deploy distributed applications.
- [Coolbeans](https://github.com/1xyz/coolbeans) "is a distributed work queue that implements the beanstalkd protocol."
  - Beanstalk is a work queue protocol that is used, in this case, to decouple the addition and processing of jobs.
  - Coolbeans utilizes RAFT consensus for high availability, which beanstalkd does not provide.
- [jackd](https://github.com/divmgl/jackd) is a beanstalk client that supports Node.JS
- [MongoDB](https://github.com/mongodb/mongo) a NoSQL database that will be used to store job outputs.
- [Caddy](https://github.com/caddyserver/caddy) (with a [reverse proxy plugin](https://github.com/lucaslorentz/caddy-docker-proxy)) is used to secure monitoring apps.
- [Prometheus](https://github.com/prometheus/prometheus) will be used to collect metrics throughout the system and provide a simple interface for querying metrics.
