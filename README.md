# An Example Distributed System
This project implements a distributed, horizontally scalable distributed system.
Users can send jobs to a RESTful API, and these jobs are inturn run on one or more workers.
For demonstration purposes, the worker simply generates a timestamp and stores it in MongoDB, representing a completed job.

The system can be deployed on Docker Swarm to provide an easy, straightforward means of spawning additional worker processes.
Docker Swarm provides an easy-to-use means of deploying highly available applicationsm; Docker Compose files are used to deploy collections of services called "stacks".

## Utilites
- [Coolbeans](https://github.com/1xyz/coolbeans) "is a distributed work queue that implements the beanstalkd protocol."
  - Beanstalk is a work queue protocol that is used, in this case, to decouple the addition and processing of jobs.
  - Coolbeans utilizes RAFT consensus for high availability, which beanstalkd does not provide.
- [node-beanstalk] is a feature-rich JavaScript client for the beanstalk protocol, made for Node.js.
  - This library provides a simple API for adding jobs to the coolbeans queue.
- [node-beanstalkd-worker](https://github.com/burstable/node-beanstalkd-worker) is a high-level library for creating beanstalk workers.
