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
  jpeg: "jpg",
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

  function parseImgTag(img) {
    const c = {};
    const u = new URL(img.getAttribute("src"), parentUrl);
    const filename = u.pathname.split('/').pop()
    return {
      url: u.href,
      text: filename,
      content_type: contentTypeFromExt(filename.split('.').pop())
    };
  }

  function parseLinkTag(a) {
    const c = {};
    const u = new URL(a.getAttribute('href'), parentUrl);
    console.log(a.href, parentUrl, u.href);

    const filename = u.pathname.split('/').pop()
    return {
      url: u.href,
      text: filename,
      content_type: contentTypeFromExt(filename.split('.').pop())
    };
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