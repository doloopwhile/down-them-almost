const {app, BrowserWindow, ipcMain, net, shell} = require('electron');
const urlModule = require("url");
const fs = require('fs');
const path = require('path');
const os = require('os');

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
  d.status = 'downloading';
  const req = net.request(d.url)
  notifyProgress();
  req.on('response', (res) => {
    if (res.statusCode !== 200) {
      notifyProgress();
      d.status = 'error';
      if (res.statusCode === 404) {
        d.error = 'Not found';
      } else {
        d.error = 'Server error';  
      }
      return;
    }

    d.dataSize = parseInt(res.headers['Content-Length']);
    if (d.dataSize < d.minimumDataSize) {
      req.abort();
      notifyProgress();
      d.status = 'skip';
      d.error  = `size < ${d.minimumDataSize / 1024}KiB`;
      return;
    }

    try {
      const dirPath = path.dirname(d.savePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
        fs.writeFileSync(d.savePath, '');
      }
    } catch(err) {
      req.abort();
      notifyProgress();
      d.status = 'error';
      d.error  = `file error`;
      return;
    }
    
    res.on('data', (data) => {
      try {
        fs.appendFileSync(d.savePath, data);
      } catch(err) {
        req.abort();
        notifyProgress();
        d.status = 'error';
        d.error  = `file error`;
        return;
      }
      d.downloadedDataSize += data.length;
      if (!isNaN(d.dataSize)) {
        d.progress = Math.floor(d.downloadedDataSize / d.dataSize);
      }
      notifyProgress();
    })
    res.on('end', () => {
      if (d.downloadedDataSize < d.minimumDataSize) {
        notifyProgress();
        d.status = 'skip';
        d.error  = `size < ${d.minimumDataSize / 1024}KiB`;
        fs.unlinkSync(d.savePath);
        return;
      }

      d.status = 'finished';
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
    if (d.status === 'downloading') {
      n += 1;
    }
  });
  for(;n < maxProcessCount; ++n) {
    const d = downloadList.find((d) => {
      return d.status == 'waiting';
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
    const relativeSavePath = relativeSavePathOfContent(content, arg.pattern, num, now);

    const d = {
      id: Math.floor((Math.random() * 10000)),
      progress: 0,
      status: 'waiting',
      relativeSavePath: relativeSavePath,
      savePath: `${config.downloadDirPath}/${relativeSavePath}`,
      url: content.url,
      content: content,
      downloadedDataSize: 0,
      dataSize: undefined,
      minimumDataSize: arg.requirements.minimumDataSize
    };
    downloadList.push(d);
  });
}

ipcMain.on('add-queue', (event, j) => {
  const arg = JSON.parse(j);
  addToDownloadList(arg);
  showProgressWindow();
});

ipcMain.on('open-saved-file', (event, j) => {
  const arg = JSON.parse(j);
  shell.showItemInFolder(arg.savePath);
});

const showProgressWindow = () => {
  if (!progressWindow) {
    progressWindow = new BrowserWindow({ parent: mainWindow });
    progressWindow.loadFile('progress.html');
    progressWindow.webContents.on('did-finish-load', () => {
      notifyProgress();
    });
  }
  progressWindow.on("close", (e) => {
    progressWindow = null;
  });
  progressWindow.showInactive();
}

const paddingZero = (t, l) => {
  while(t.legnth < l) {
    t = "0" + t;
  }
  return t;
}

const relativeSavePathOfContent = (content, pattern, num, now) => { 
  return pattern.
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
};
