#!/bin/bash
node copyPackage.js
git add .
git commit -m "deployCommit"
npm version $1
updatedVersion=$(node syncVersion.js);
git add .
git commit -m "release $updatedVersion"
git tag -a $updatedVersion -m "updating to $updatedVersion"
git push --follow-tags origin master
