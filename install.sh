#!/bin/bash

sudo docker run --rm -ti -v ${PWD}:/project -v ${PWD##*/}-node-modules:/project/node_modules -v ~/.electron:/root/.electron electronuserland/electron-builder:wine /bin/bash -c "npm install && npm prune && npm run dist"