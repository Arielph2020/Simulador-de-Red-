const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow () {
  // Configuración de la ventana de Windows
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 768,
    autoHideMenuBar: true, // Oculta el menú superior (Archivo, Editar, etc.)
    icon: path.join(__dirname, 'icon.ico'), // Opcional: si de agrega un icono
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Maximizar la ventana al inicio para mayor inmersión
  win.maximize();

  // Cargar el archivo HTML del simulador
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
