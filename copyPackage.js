const fs=require('fs');
var htmlPackage=JSON.parse(fs.readFileSync("./SkyPetGUI/package.json"))
var currPackage=JSON.parse(fs.readFileSync("./electron.package.json"))
htmlPackage.scripts.test=currPackage.scripts.test;
Object.assign(currPackage.dependencies, htmlPackage.dependencies);
Object.assign(currPackage.scripts, htmlPackage.scripts);
fs.writeFileSync("./package.json", JSON.stringify(currPackage, null, '\t'));
