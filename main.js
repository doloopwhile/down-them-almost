const {app, BrowserWindow, ipcMain, net} = require('electron');
const urlModule = require("url");
const fs = require('fs');

let mainWindow
let progressWindow

function createWindow () {
  mainWindow = new BrowserWindow({width: 800, height: 600})
  mainWindow.loadFile('top.html')
  mainWindow.on('closed', function () {
    mainWindow = null
  });

  progressWindow = new BrowserWindow({ parent: mainWindow });
  progressWindow.loadFile('progress.html');
}

app.on('ready', () => {
  createWindow();
});

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

ipcMain.on('open-inspection-view', function(event, j) {
  const arg = JSON.parse(j);
  const w = new BrowserWindow({
    parent: mainWindow, 
    show: false,
  });
  w.webContents.on('did-finish-load', function() {
    const a = JSON.stringify({
      parentUrl: arg.url,
      contents: arg.contents
    });
    w.webContents.send('store-data', a);
  });
  w.loadURL('inspection_view.html');
  w.showInactive();
});

const downloadList = [];
const config = {
  downloadDirPath: '/Users/kenjiomoto/Downloads'
};
const maxProcessCount = 5;

function startDownloadProcess(d) {
  d.started = true;
  const req = net.request(d.url)
  notifyProgress();
  req.on('response', (res) => {
    if (res.statusCode !== 200) {
      notifyProgress();
      return;
    }

    d.dataSize = parseInt(res.headers['Content-Length']);
    res.on('data', (data) => {
      fs.appendFileSync(d.savePath, data);
      d.downloadedDataSize += data.length;
      if (!isNaN(d.dataSize)) {
        d.progress = Math.floor(d.downloadedDataSize / d.dataSize);
      }
      notifyProgress();
    })
    res.on('end', () => {
      d.finished = true;
      d.progress = 100;
      notifyProgress();
    })
  }).end();
}

const notifyProgress = () => {
  if (progressWindow) {
    progressWindow.webContents.send("progress", JSON.stringify(downloadList));
  }
}


setInterval(() => {
  let n = 0;
  downloadList.forEach((d) => {
    if (d.started && !d.finished) {
      n += 1;
    }
  });
  for(;n < maxProcessCount; ++n) {
    const d = downloadList.find((d) => {
      return !d.started;
    });
    if (d !== undefined) {
      startDownloadProcess(d);
    }  
  }
}, 1000);

function addToDownloadList(arg) {
  arg.contents.forEach(function(content, i) {
    const d = {
      id: Math.floor((Math.random() * 10000)),
      progress: 0,
      started: false,
      savePath: `${config.downloadDirPath}/${i.toString()}`,
      url: content.url,
      content: content,
      finished: false,
      downloadedDataSize: 0,
      dataSize: undefined
    };
    downloadList.push(d);
  });
}

addToDownloadList({
  contents: [
    { url: 'https://i.gzn.jp/img/2018/07/27/wf2018s-matome/00_m.jpg' },
    { url: 'https://i.gzn.jp/img/2018/07/27/wf2018s-matome/00_m.jpg' },
    { url: 'https://i.gzn.jp/img/2018/07/27/wf2018s-matome/00_m.jpg' },
    { url: 'https://i.gzn.jp/img/2018/07/27/wf2018s-matome/00_m.jpg' },
    { url: 'https://i.gzn.jp/img/2018/07/27/wf2018s-matome/00_m.jpg' },
    { url: 'https://i.gzn.jp/img/2018/07/27/wf2018s-matome/00_m.jpg' },
    { url: 'https://i.gzn.jp/img/2018/07/27/wf2018s-matome/00_m.jpg' },
    { url: 'https://i.gzn.jp/img/2018/07/27/wf2018s-matome/00_m.jpg' },
    { url: 'https://i.gzn.jp/img/2018/07/27/wf2018s-matome/00_m.jpg' },
    { url: 'https://i.gzn.jp/img/2018/07/27/wf2018s-matome/00_m.jpg' },
  ]
});
ipcMain.on('add-queue', (event, j) => {
  const arg = JSON.parse(j);
  addToDownloadList(arg.pattern, arg.contents);
});
