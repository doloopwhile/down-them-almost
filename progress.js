const {ipcRenderer, remote} = require('electron');

ipcRenderer.on("store-progress", (event, j) => {
    const arg = JSON.parse(j);
});