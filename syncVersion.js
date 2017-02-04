const fs=require('fs');
const electronPackagePath="./electron.package.json";
var currPackage=JSON.parse(fs.readFileSync(electronPackagePath))
var package=JSON.parse(fs.readFileSync("./package.json"))
currPackage.version=package.version;

fs.writeFileSync(electronPackagePath, JSON.stringify(currPackage, null, '\t'));
return package.version;