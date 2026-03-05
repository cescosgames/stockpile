const { contextBridge, ipcRenderer } = require("electron");

// contextBridge.exposeInMainWorld is the ONLY safe way to give the renderer
// access to Node/Electron capabilities. It creates window.electronAPI in the
// React app, but nothing else from Node leaks through.
contextBridge.exposeInMainWorld("electronAPI", {
  // get(key) → asks the main process to read from electron-store
  get: (key) => ipcRenderer.invoke("store:get", key),
  // set(key, value) → asks the main process to write to electron-store
  set: (key, value) => ipcRenderer.invoke("store:set", key, value),
});
