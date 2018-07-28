const {app, BrowserWindow, ipcMain, net} = require('electron')
const urlModule = require("url");

let mainWindow

function createWindow () {
  mainWindow = new BrowserWindow({width: 800, height: 600})
  mainWindow.loadFile('top.html')
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
});

const extMapping = {
  jpeg: "jpg",
  jpeg: "jpg",
  gif: "gif",
  png: "png",
  bmp: "bmp"
}

function inspectPage(url) {
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
    c.url = img.url;
    const filename = urlModule.parse(img.url).pathname.split('/').pop()
    c.text = filename;
    c.content_type = contentTypeFromExt(filename.split('.').pop());
    return c;
  }

  function parseLinkTag(a) {
    const c = {};
    c.url = a.href;
    const filename = urlModule.parse(a.url).pathname.split('/').pop()
    c.text = filename;
    c.content_type = contentTypeFromExt(filename.split('.').pop());
    return c;
  }

  return new Promise((resolve, reject) => {
    console.log(url);
    request = net.request({
      url: url,
      redirect: "follow"
    }).on('response', (response) => {
      console.log(response);
      let text = '';
      response.on('data', (chunk) => {
        text += chunk;
      });
      response.on('end', () => { resolve(text); });
    }).end();
  }).then((text) => {
    console.log(text);
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
  });
}

ipcMain.on('open-inspection-view', function(event, j) {
  const arg = JSON.parse(j);

  inspectPage(arg.url).then((contents) => {
    const w = new BrowserWindow({
      parent: mainWindow, 
      show: false,
    });
    w.webContents.on('did-finish-load', function() {
      const a = JSON.stringify({
        parentUrl: arg.url,
        contents: contents
      });
      w.webContents.send('store-data', a);
    });
    w.loadURL(`file://${__dirname}/inspection_view.html`);
    w.showInactive();
  });
});

ipcMain.on('add-queue', (event, j) => {
  console.log(j);
});