"use strict";

const fs = require("fs");
const path = require("path");

/**
 * With signAndEditExecutable disabled, the packaged exe would keep the stock
 * Electron icon. Embed the DCI icon and proper metadata for both apps.
 */
module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== "win32") return;
  const rcedit = require("rcedit");
  const { appOutDir, packager } = context;
  const productName = packager.appInfo.productFilename;
  const exePath = path.join(appOutDir, `${productName}.exe`);
  if (!fs.existsSync(exePath)) return;
  const icoPath = path.join(packager.projectDir, "assets", "app-icon.ico");
  if (!fs.existsSync(icoPath)) return;
  await rcedit(exePath, {
    icon: icoPath,
    "version-string": {
      FileDescription: productName,
      ProductName: productName,
      LegalCopyright: "pikespeak83",
      OriginalFilename: `${productName}.exe`,
      CompanyName: "Data Containment Initiative"
    }
  });
};
