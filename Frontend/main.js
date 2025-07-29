const { app, BrowserWindow, ipcMain } = require('electron');

let mainWin;
let examWin;

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  mainWin.loadFile('Admin/Html/login.html');

}

function createExamWindow() {
  examWin = new BrowserWindow({
    fullscreen: true,
    kiosk: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  examWin.loadFile('exam.html');

  // If user switches app, auto-submit with score
  examWin.on('blur', () => {
    examWin.webContents.send('auto-submit');
  });

  // From exam window, result sent
  ipcMain.once('exam-result', (_, result) => {
    if (examWin) examWin.close();
    mainWin.webContents.send('show-result', result);
  });
}

ipcMain.on('start-exam', () => {
  createExamWindow();
});

app.whenReady().then(createMainWindow);
