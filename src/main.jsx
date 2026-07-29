import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

window.addEventListener("error", (e) => { window.__lastError = String(e.message || e.error); });
window.addEventListener("unhandledrejection", (e) => { window.__lastError = String(e.reason); });

createRoot(document.getElementById("root")).render(<App />);
