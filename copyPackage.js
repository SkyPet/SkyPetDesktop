const fs=require('fs');
const htmlPackage=JSON.parse(fs.readFileSync("./SkyPetGUI/package.json"))
var currPackage=JSON.parse(fs.readFileSync("./electron.package.json"))
Object.assign(currPackage.dependencies, htmlPackage.dependencies);
Object.assign(currPackage.scripts, htmlPackage.scripts);
console.log(htmlPackage);
console.log(currPackage);
fs.writeFileSync("./package.json", JSON.stringify(currPackage));
