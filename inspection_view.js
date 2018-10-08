const {ipcRenderer, remote} = require('electron');

const updateCounts = () => {
    document.getElementById("countOfAll").textContent = document.querySelectorAll('#contents input[type=checkbox]').length;
    document.getElementById("countOfSelected").textContent = document.querySelectorAll('#contents input[type=checkbox]:checked').length;
};

document.getElementById("selectAll").addEventListener("click", () => {
    const t = document.getElementById('contents');
    t.querySelectorAll("input[type=checkbox]").forEach((e) => { e.checked = true; });
    updateCounts();
});

document.getElementById("unselectAll").addEventListener("click", () => {
    const t = document.getElementById('contents');
    t.querySelectorAll("input[type=checkbox]").forEach((e) => { e.checked = false; });
    updateCounts();
});

document.getElementById("selectJPG").addEventListener("click", () => {
    selectByContentType("jpg");
    updateCounts();
});

document.getElementById("selectPNG").addEventListener("click", () => {
    selectByContentType("png");
    updateCounts();
});

document.getElementById("selectGIF").addEventListener("click", () => {
    selectByContentType("gif");
    updateCounts();
});

document.getElementById("selectImages").addEventListener("click", () => {
    selectByContentType("jpg");
    selectByContentType("png");
    selectByContentType("gif");
    updateCounts();
});

const selectByContentType = (content_type) => {
    const t = document.getElementById('contents');
    t.querySelectorAll("tbody tr").forEach((e) => {
        const c = JSON.parse(e.dataset.content);
        if (c.content_type == content_type) {
            e.querySelector("input[type=checkbox]").checked = true;
        }
    });
};

document.getElementById("cancel").addEventListener("click", () => {
    remote.getCurrentWindow().close();
});

document.getElementById("start").addEventListener("click", () => {
    const t = document.getElementById('contents');
    const contents = [];
    t.querySelectorAll("tbody tr").forEach((e) => {
        if (e.querySelector("input[type=checkbox]").checked) {
            contents.push(JSON.parse(e.dataset.content));
        }
    });
    const pattern = document.getElementById("pattern").value;
    const minimumDataSize = (() => {
        const v = document.getElementById("minimumDataSize").value;
        if (v === null) {
            return 0;
        }
        return parseInt(v) * 1024;
    })();
    const arg = {
        contents: contents,
        pattern: pattern,
        requirements: {
            minimumDataSize: minimumDataSize
        }
    }
    ipcRenderer.send("add-queue", JSON.stringify(arg));
    remote.getCurrentWindow().close();
});

const selection = [];

ipcRenderer.on("store-data", (event, j) => {
    const arg = JSON.parse(j);

    document.getElementById('parentUrl').innerText = arg.parentUrl;
    const t = document.getElementById('contents');
    const tbody = t.querySelector('tbody');

    arg.contents.forEach(function(c) {
        const tdCheckbox = document.createElement("td");
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.onchange = updateCounts;
        tdCheckbox.appendChild(cb);

        const tdUrl = document.createElement('td');
        tdUrl.innerText = c.url;
        const tdType = document.createElement('td');
        tdType.innerText = c.content_type;
        const tdText = document.createElement('td');
        tdText.innerText = c.text;

        const tr = document.createElement('tr');
        tdUrl.onclick  = () => { cb.checked = !cb.checked; };
        tdText.onclick = () => { cb.checked = !cb.checked; };
        tdType.onclick = () => { cb.checked = !cb.checked; };

        tr.dataset.content = JSON.stringify(c);
        tr.appendChild(tdCheckbox);
        tr.appendChild(tdUrl);
        tr.appendChild(tdText);
        tr.appendChild(tdType);
        tbody.appendChild(tr);
    });

    updateCounts();
});
