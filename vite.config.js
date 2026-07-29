const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");

module.exports = defineConfig({
  // Required for Electron loadFile(file://): absolute "/assets/..." breaks the renderer in production.
  base: "./",
  plugins: [react()],
  server: {
    port: 5178,
    strictPort: true
  }
});
