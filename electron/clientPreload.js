const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("fieldApi", {
  getConfig: () => ipcRenderer.invoke("config:get"),
  saveConfig: (partial) => ipcRenderer.invoke("config:save", partial),
  getSysInfo: () => ipcRenderer.invoke("sys:info"),

  discover: () => ipcRenderer.invoke("field:discover"),
  download: (url) => ipcRenderer.invoke("field:download", url),
  openDownloads: () => ipcRenderer.invoke("field:openDownloads"),

  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),

  onDownload: (handler) => {
    if (typeof handler !== "function") return () => {};
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on("field:download", listener);
    return () => ipcRenderer.removeListener("field:download", listener);
  }
});
