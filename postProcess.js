const fs=require('fs');
const loc="./build/index.html";
const html=fs.readFileSync(loc).toString();
fs.writeFileSync(loc.replace("index.html", "electronIndex.html"), html.replace("</head>", "</head><script>window.socket=require('electron').ipcRenderer</script>"));
