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
updatedVersion=$(node syncVersion.js);
#echo "$updatedVersion"
git add .
git commit -m "release $updatedVersion"
printf git tag -a $updatedVersion -m "updating to $updatedVersion"
#git push --follow-tags origin master
