##Skypet Electron
This package uses the Skypet GUI repository for the html.  There are a number of scripts to run to get everything in order.  First, run 

`node copyPackage.js`. 

This will create a "package.json" with the necessary dependencies and scripts.  We need to now install the dependencies:

`npm install`

Now we build the client GUI html and prepare everything for electron. Note that this generates the html into "build-react" instead of "build".

`npm run build-electron-react`

Now we run the electron development:

`npm run start-electron`

To do any GUI edits edit SkyPetGUI and NOT THE COPIED GUI that is in "src" and "public".  

Any additional server edits requires a rebuild, which means just rerunning 

`npm run build-electron-react`

##Production/Binary

To create a distributable binary, on Ubuntu first do:

`sudo apt-get install --no-install-recommends -y icnsutils graphicsmagick xz-utils`

Then `npm run dist`