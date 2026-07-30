import React, { useEffect, useState } from "react";
import { playSound } from "../../lib/sounds.js";

const KEYS = [
  ["C", "danger"], ["+/-", "op"], ["%", "op"], ["/", "op"],
  ["7"], ["8"], ["9"], ["*", "op"],
  ["4"], ["5"], ["6"], ["-", "op"],
  ["1"], ["2"], ["3"], ["+", "op"],
  ["0"], ["."], ["<", "op"], ["=", "eq"]
];

/** Vault calculator: standard four-function with keyboard support. */
export default function CalculatorApp() {
  const [display, setDisplay] = useState("0");
  const [tape, setTape] = useState("");
  const [acc, setAcc] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(true);

  function compute(a, b, operator) {
    switch (operator) {
      case "+": return a + b;
      case "-": return a - b;
      case "*": return a * b;
      case "/": return b === 0 ? NaN : a / b;
      default: return b;
    }
  }

  function fmt(n) {
    if (!Number.isFinite(n)) return "ERR";
    const s = String(Math.round(n * 1e10) / 1e10);
    return s.length > 14 ? n.toExponential(6) : s;
  }

  function press(key) {
    playSound("click", 0.25);
    if (key >= "0" && key <= "9") {
      setDisplay((d) => (fresh || d === "0" ? key : (d.length < 14 ? d + key : d)));
      setFresh(false);
      return;
    }
    switch (key) {
      case ".":
        setDisplay((d) => (fresh ? "0." : d.includes(".") ? d : `${d}.`));
        setFresh(false);
        break;
      case "C":
        setDisplay("0"); setTape(""); setAcc(null); setOp(null); setFresh(true);
        break;
      case "<":
        setDisplay((d) => (fresh || d.length <= 1 ? "0" : d.slice(0, -1)));
        break;
      case "+/-":
        setDisplay((d) => (d.startsWith("-") ? d.slice(1) : d === "0" ? d : `-${d}`));
        break;
      case "%":
        setDisplay((d) => fmt(parseFloat(d) / 100));
        break;
      case "=": {
        if (op == null || acc == null) return;
        const result = compute(acc, parseFloat(display), op);
        setTape(`${fmt(acc)} ${op} ${display} =`);
        setDisplay(fmt(result));
        setAcc(null); setOp(null); setFresh(true);
        break;
      }
      default: { // + - * /
        const value = parseFloat(display);
        const nextAcc = op != null && acc != null && !fresh ? compute(acc, value, op) : value;
        setAcc(nextAcc);
        setOp(key);
        setTape(`${fmt(nextAcc)} ${key}`);
        setDisplay(fmt(nextAcc));
        setFresh(true);
      }
    }
  }

  useEffect(() => {
    function onKey(e) {
      const k = e.key;
      if (/^[0-9]$/.test(k)) press(k);
      else if (k === ".") press(".");
      else if (k === "+" || k === "-" || k === "*" || k === "/") press(k);
      else if (k === "Enter" || k === "=") press("=");
      else if (k === "Backspace") press("<");
      else if (k === "Escape") press("C");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="calc">
      <div className="calc-screen">{display}</div>
      <div className="calc-tape">{tape || "\u00a0"}</div>
      <div className="calc-grid">
        {KEYS.map(([key, cls]) => (
          <button key={key} className={`calc-key ${cls || ""}`} onClick={() => press(key)}>
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
