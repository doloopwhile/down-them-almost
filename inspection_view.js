const {ipcRenderer} = require('electron');
//const var { remote } = require('electron');

opcRenderer.on("store-data", (event, j) => {
    const arg = JSON.parse(j);
    alert(arg);
});
