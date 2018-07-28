const {ipcRenderer, remote} = require('electron');

document.getElementById("selectAll").addEventListener("click", () => {
    const t = document.getElementById('contents');
    t.querySelectorAll("input[type=checkbox]").forEach((e) => { e.checked = true; });
});

document.getElementById("unselectAll").addEventListener("click", () => {
    const t = document.getElementById('contents');
    t.querySelectorAll("input[type=checkbox]").forEach((e) => { e.checked = false; });
});

document.getElementById("cancel").addEventListener("click", () => {
    remote.getCurrentWindow().close();
});

document.getElementById("start").addEventListener("click", () => {
    const t = document.getElementById('contents');
    const contents = [];
    t.querySelectorAll("tr").forEach((e) => {
        if (e.querySelector("input[type=checkbox]").checked) {
            contents.push(JSON.parse(e.dataset.content));
        }
    });
    const pattern = document.getElementById("pattern").value;
    const arg = {
        contents: contents,
        pattern: pattern
    }
    ipcRenderer.send("add-queue", JSON.stringify(arg));
    remote.getCurrentWindow().close();
});

ipcRenderer.on("store-data", (event, j) => {
    const arg = JSON.parse(j);

    document.getElementById('parentUrl').innerText = arg.parentUrl;
    const t = document.getElementById('contents');
    arg.contents.forEach(function(c) {
        const tdCheckbox = document.createElement("td");
        const cb = document.createElement("input");
        cb.type = "checkbox";
        tdCheckbox.appendChild(cb);

        const tdUrl = document.createElement('td');
        tdUrl.innerText = c.url;
        const tdType = document.createElement('td');
        tdType.innerText = c.content_type;
        const tdText = document.createElement('td');
        tdName.innerText = c.text;

        const tr = document.createElement('tr');
        tr.dataset.content = JSON.stringify(c);
        tr.appendChild(tdCheckbox);
        tr.appendChild(tdUrl);
        tr.appendChild(tdText);
        tr.appendChild(tdType);

        t.appendChild(tr);
    });
});
