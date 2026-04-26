const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process'); 
const path = require('path'); 

let servidorPython; 

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false 
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  const rutaPython = path.join(__dirname, '..', 'backend', 'venv', 'Scripts', 'python.exe');
  const rutaScript = path.join(__dirname, '..', 'backend', 'nucleo.py');

  console.log("Iniciando el cerebro en Python...");
  servidorPython = spawn(rutaPython, [rutaScript]);

  servidorPython.stdout.on('data', (data) => {
    console.log(`Mensaje de Python: ${data}`);
  });

  servidorPython.stderr.on('data', (data) => {
    console.error(`🚨 ALERTA DE PYTHON: ${data}`);
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (servidorPython) {
    console.log("Apagando el servidor Python...");
    servidorPython.kill(); 
  }
  if (process.platform !== 'darwin') app.quit();
});