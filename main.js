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
  const w = new BrowserWindow({show: false});
  w.loadFile('inspection_view.html');
  w.webContents.on('did-finish-load', function() {
    const a = JSON.stringify({
      parentUrl: arg.url,
      contents: arg.contents
    });
    w.webContents.send('store-data', a);
  });
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
  const now = new Date;
  arg.contents.forEach(function(content, i) {
    const num = downloadList.length + 1;
    const savePath = savePathOfContent(content, arg.pattern, num, now);

    const d = {
      id: Math.floor((Math.random() * 10000)),
      progress: 0,
      started: false,
      savePath: savePath,
      url: content.url,
      content: content,
      finished: false,
      downloadedDataSize: 0,
      dataSize: undefined
    };
    downloadList.push(d);
  });
}

ipcMain.on('add-queue', (event, j) => {
  const arg = JSON.parse(j);
  addToDownloadList(arg);
  showProgressWindow();
});

const showProgressWindow = () => {
  if (!progressWindow) {
    progressWindow = new BrowserWindow({ parent: mainWindow });
    progressWindow.loadFile('progress.html');
  }
  progressWindow.showInactive();
}

const paddingZero = (t, l) => {
  while(t.legnth < l) {
    t = "0" + t;
  }
  return t;
}

const savePathOfContent = (content, pattern, num, now) => { 
  const path = pattern.
    replace("{path}", content.path).
    replace("{name}", content.name).
    replace("{ext}",  content.ext).
    replace("{text}", content.text).
    replace("{yyyy}", (now.getYear() + 1900).toString()).
    replace("{mm}",   paddingZero((now.getMonth() + 1).toString(), 2)).
    replace("{dd}",   paddingZero(now.getDate().toString(), 2)).
    replace("{HH}",   paddingZero(now.getHours().toString(), 2)).
    replace("{MM}",   paddingZero(now.getMinutes().toString(), 2)).
    replace("{SS}",   paddingZero(now.getSeconds().toString(), 2)).
    replace("{subdir}", content.subdir).
    replace("{url}", content.url).
    replace("{num}", num)
  ;
 
  return `${config.downloadDirPath}/${path}`;
};
