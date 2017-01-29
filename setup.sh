#!/bin/bash
git pull origin master

function cloneAndCheckout {
	if [ -d "$1" ]; then
		cd $1
		git pull origin master
        cd ..
	else
		git clone https://github.com/skyPet/$1
	fi
}
cloneAndCheckout "SkyPetGUI"
cloneAndCheckout "SkyPetSmartContractWrapper"
node copyPackage



