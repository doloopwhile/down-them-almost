const {ipcRenderer} = require('electron');

const inspect = document.getElementById("inspect");
const urlInput = document.getElementById("url");

inspect.addEventListener("click", function() {
    const arg = JSON.stringify({ url: urlInput.value });
    ipcRenderer.send('open-inspection-view', arg);
});
