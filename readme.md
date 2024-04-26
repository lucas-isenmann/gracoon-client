# Gracoon Client

Gracoon is an online collaborative graph editor.
This repository is the client part.

The server project can be found there: [https://github.com/lucas-test/gracoon-server](https://github.com/lucas-test/gracoon-server)

## Installation, launch

Copy the example environment configuration file example:

    cp src/.env.json.example src/.env.json 

Change the `.env.json` with the ip/domain of the server and the port used.

To launch it in a developpement environment:

    npm ci
    npm run dev

To correctly use it run your own server or connect to an existing one.

## Test it

A server is running on [www.gracoon.com](https://www.gracoon.com) :rocket:
