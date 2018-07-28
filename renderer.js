const {ipcRenderer} = require('electron');

const inspect = document.getElementById("inspect");
const urlInput = document.getElementById("url");

inspect.addEventListener("click", function() {
    ipcRenderer.send('open-inspection-view', { url: urlInput.text });
});
