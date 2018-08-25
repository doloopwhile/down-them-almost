const {ipcRenderer} = require('electron');

const inspect = document.getElementById("inspect");
const urlInput = document.getElementById("url");

inspect.addEventListener("click", function() {
  const url = urlInput.value;
  inspectPage(url).then((contents) => {
    const arg = JSON.stringify({
      contents: contents,
      url: url
    });
    ipcRenderer.send('open-inspection-view', arg);  
  });
});

const extMapping = {
  jpg: "jpg",
  jpeg: "jpg",
  gif: "gif",
  png: "png",
  bmp: "bmp"
}

function inspectPage(parentUrl) {
  function contentTypeFromExt(ext) {
    ext = ext.toLowerCase();
    const t = extMapping[ext];
    if (t === undefined) {
      return 'unknown';
    }
    return t;
  }

  createContent = (url, text) => {
    const filename = url.pathname.split('/').pop()
    const name = filename.split(".").shift();
    const ext = filename.split(".").pop();
    
    if (text == null || text == "") {
      text = name;
    }

    return {
      name: name,
      ext: ext,
      path: url.pathname,
      host: url.host,
      text: filename,
      url: url.href,
      content_type: contentTypeFromExt(filename.split('.').pop()),
    };
  };

  function parseImgTag(img) {
    const c = {};
    const u = new URL(img.getAttribute("src"), parentUrl);
    return createContent(u, img.getAttribute("alt"));
  }

  function parseLinkTag(a) {
    const c = {};
    const u = new URL(a.getAttribute('href'), parentUrl);
    return createContent(u, null);
  }
      
  return fetch(parentUrl)
    .then((resp) => { return resp.text() })
    .then((text) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html')
      const contents = [];
      doc.querySelectorAll("a, img").forEach((e) => {
        if (e.tagName == "IMG") {
          contents.push(parseImgTag(e));
        } else {
          contents.push(parseLinkTag(e));
        }
      });
      return contents;
    });
}