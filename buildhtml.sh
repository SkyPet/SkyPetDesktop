#!/bin/bash
rm -r -f build-react
rm -r -f build 
npm run rm-public 
npm run rm-src
npm run copy-src 
npm run copy-public 
cross-env REACT_APP_ELECTRON='true' npm run build 
echo "$(</home/travis/build/SkyPet/SkyPetDesktop/npm-debug.log)"
npm run post-process-react 
npm run rename-client-build 
npm run copy-icon