const {ipcRenderer, remote} = require('electron');

ipcRenderer.on("progress", (event, j) => {
    const downloadList = JSON.parse(j);
    const table = document.getElementById("progress");
    table.innerHTML = '';

    downloadList.forEach(d => {
        const tr = document.createElement('tr');
        
        const tdUrl = document.createElement('td');
        tdUrl.innerText = d.url;
        tr.appendChild(tdUrl);

        const tdStatus = document.createElement('td');
        tdStatus.innerText = statusText(d);
        tr.appendChild(tdStatus);

        const tdProgress = document.createElement('td');
        tdProgress.innerText = d.progress.toString();
        tr.appendChild(tdProgress);

        table.appendChild(tr);
    });
});

const statusText = (d) => {
    if (!d.started) {
        return 'Waiting';
    } else if (!d.finished) {
        return 'Downloading';
    } else {
        return 'Finished';
    }
}
