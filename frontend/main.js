const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process'); // Herramienta para ejecutar otros programas
const path = require('path'); // Herramienta para armar rutas de carpetas

let servidorPython; // Aquí guardaremos el proceso del backend para poder apagarlo después

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

// Cuando Electron esté listo para arrancar...
app.whenReady().then(() => {
  
  // 1. Buscamos la ruta exacta donde vive tu entorno virtual de Python
  // __dirname es la carpeta 'frontend', así que subimos una carpeta ('..') y entramos al backend
  const rutaPython = path.join(__dirname, '..', 'backend', 'venv', 'Scripts', 'python.exe');
  const rutaScript = path.join(__dirname, '..', 'backend', 'nucleo.py');

  // 2. Encendemos a Python de forma invisible en el fondo
  console.log("Iniciando el cerebro en Python...");
  servidorPython = spawn(rutaPython, [rutaScript]);

  // Si Python nos quiere decir algo (como errores), lo mostramos en la consola
  servidorPython.stdout.on('data', (data) => {
    console.log(`Mensaje de Python: ${data}`);
  });

  // NUEVO: Si Python choca, que nos grite el error en la terminal
  servidorPython.stderr.on('data', (data) => {
    console.error(`🚨 ALERTA DE PYTHON: ${data}`);
  });

  // 3. Finalmente, abrimos la ventana visual
  createWindow();
});

// Cuando el usuario presiona la 'X' para cerrar todas las ventanas...
app.on('window-all-closed', () => {
  
  // ¡Fase 3: El final limpio! Si Python está corriendo, lo "matamos" (apagamos)
  if (servidorPython) {
    console.log("Apagando el servidor Python...");
    servidorPython.kill(); 
  }

  // Cerramos la aplicación
  if (process.platform !== 'darwin') app.quit();
});