const fs=require('fs');
const htmlPackage=JSON.parse(fs.readFileSync("./SkyPetGUI/package.json"))
const smartContractPackage=JSON.parse(fs.readFileSync("./SkyPetSmartContractWrapper/package.json"))
var currPackage=JSON.parse(fs.readFileSync("./electron.package.json"))
Object.assign(currPackage.dependencies, htmlPackage.dependencies, smartContractPackage.dependencies);
Object.assign(currPackage.scripts, htmlPackage.scripts);
fs.writeFileSync("./package.json", JSON.stringify(currPackage));
