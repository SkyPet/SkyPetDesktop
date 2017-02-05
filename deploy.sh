#!/bin/bash
if [ -z "$1" ]
  then
    echo "Supply an npm version type, eg patch"
    exit
fi
node copyPackage.js
git add .
git commit -m "deployCommit"
npm version $1
updatedVersion=$(node syncVersion.js)
git add .
git commit -m "release v$updatedVersion"
git tag -a "v$updatedVersion" -m "updating to v$updatedVersion"
git push origin master
git push origin --tags
