const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("archiveApi", {
  getConfig: () => ipcRenderer.invoke("config:get"),
  saveConfig: (partial) => ipcRenderer.invoke("config:save", partial),
  getSysInfo: () => ipcRenderer.invoke("sys:info"),

  pickFolder: () => ipcRenderer.invoke("archive:pickFolder"),
  listDrives: () => ipcRenderer.invoke("archive:listDrives"),
  addDriveSource: (letter, label) => ipcRenderer.invoke("archive:addDrive", letter, label),
  addFolderSource: () => ipcRenderer.invoke("archive:addFolder"),
  removeSource: (sourceId) => ipcRenderer.invoke("archive:removeSource", sourceId),
  browse: (relPath) => ipcRenderer.invoke("archive:browse", relPath),
  getArchiveStats: () => ipcRenderer.invoke("archive:stats"),
  openFile: (relPath) => ipcRenderer.invoke("archive:openFile", relPath),

  getLanState: () => ipcRenderer.invoke("lan:getState"),
  setSharing: (enabled) => ipcRenderer.invoke("lan:setSharing", enabled),
  restartLan: () => ipcRenderer.invoke("lan:restart"),
  approveDevice: (deviceId) => ipcRenderer.invoke("devices:approve", deviceId),
  denyDevice: (deviceId) => ipcRenderer.invoke("devices:deny", deviceId),
  revokeDevice: (deviceId) => ipcRenderer.invoke("devices:revoke", deviceId),
  getPortalQr: (url) => ipcRenderer.invoke("portal:qr", url),

  minimize: () => ipcRenderer.invoke("window:minimize"),
  maximize: () => ipcRenderer.invoke("window:maximize"),
  close: () => ipcRenderer.invoke("window:close"),

  onLanEvent: (handler) => {
    if (typeof handler !== "function") return () => {};
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on("lan:event", listener);
    return () => ipcRenderer.removeListener("lan:event", listener);
  },
  onLanState: (handler) => {
    if (typeof handler !== "function") return () => {};
    const listener = (_event, payload) => handler(payload);
    ipcRenderer.on("lan:state", listener);
    return () => ipcRenderer.removeListener("lan:state", listener);
  }
});
