const {ipcRenderer, remote} = require('electron');

ipcRenderer.on("progress", (event, j) => {
    const downloadList = JSON.parse(j);
    const table = document.getElementById("progress");
    const tbody = table.querySelector('tbody');
    
    tbody.innerHTML = '';
    downloadList.forEach(d => {
        const tr = document.createElement('tr');
        tr.dataset.content = JSON.stringify(d);
        tr.className = trClassName(d);
        
        const tdUrl = document.createElement('td');
        tdUrl.innerText = d.url;
        tr.appendChild(tdUrl);

        const tdPath = document.createElement('td');
        tdPath.innerText = d.relativeSavePath;
        if (d.status == 'finished') {
            tdPath.onclick = () => {
                ipcRenderer.send('open-saved-file', JSON.stringify(d));
            }
            tdPath.className = 'tdFinishedFile';
        }
        tr.appendChild(tdPath);

        const tdStatus = document.createElement('td');
        tdStatus.innerText = statusText(d);
        tr.appendChild(tdStatus);

        const tdProgress = document.createElement('td');
        tdProgress.innerText = d.progress.toString();
        tr.appendChild(tdProgress);

        const tdError = document.createElement('td');
        if (d.error != null) {
            const retry = document.createElement('button');
            retry.textContent = 'Retry';
            retry.onclick = () => {
                alert("Retry!");
            }
            td.appendChild(retry);

            const errorMessage = document.createElement('span');
            errorMessage.innerText = d.error;
            td.appendChild(errorMessage);
        }
        tr.appendChild(tdError);

        tbody.appendChild(tr);
    });
});

const statusText = (d) => {
    if (d.status == 'error') {
        return 'Error';
    } else if (d.status == 'waiting') {
        return 'Waiting';
    } else if (d.status == 'skip') {
        return 'Skipped';
    } else if (d.status == 'downloading') {
        return 'Downloading';
    } else {
        return 'Finished';
    }
}

const trClassName = (d) => {
    return `progress-${d.status}`;
}
