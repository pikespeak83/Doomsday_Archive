const path = require("path");
const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");

module.exports = defineConfig({
  // Required for Electron loadFile(file://): absolute "/assets/..." breaks the renderer in production.
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        host: path.resolve(__dirname, "index.html"),
        client: path.resolve(__dirname, "client.html")
      }
    }
  },
  server: {
    port: 5178,
    strictPort: true
  }
});
