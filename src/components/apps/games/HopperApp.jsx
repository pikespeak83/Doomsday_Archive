import React, { useEffect, useRef, useState } from "react";
import { playSound } from "../../../lib/sounds.js";

const COLS = 13;
const ROWS = 12;
const CELL = 32;
// rows 1-5 traffic, 6 median, 7-10 traffic, 11 start, 0 goal
const LANES = [
  { y: 1, speed: 0.045, gap: 4 },
  { y: 2, speed: -0.06, gap: 5 },
  { y: 3, speed: 0.08, gap: 4 },
  { y: 4, speed: -0.05, gap: 3 },
  { y: 5, speed: 0.07, gap: 5 },
  { y: 7, speed: -0.075, gap: 4 },
  { y: 8, speed: 0.055, gap: 3 },
  { y: 9, speed: -0.09, gap: 5 },
  { y: 10, speed: 0.065, gap: 4 }
];

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export default function HopperApp() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("da-hopper-best") || 0));
  const [lives, setLives] = useState(3);
  const [state, setState] = useState("ready");
  const world = useRef(null);

  function fresh() {
    return {
      frog: { x: 6, y: 11 },
      cars: LANES.map((lane) => ({
        ...lane,
        xs: Array.from({ length: Math.ceil(COLS / lane.gap) }, (_, i) => i * lane.gap + (lane.y % 3))
      }))
    };
  }

  function start() {
    world.current = fresh();
    setScore(0);
    setLives(3);
    setState("run");
    playSound("confirm", 0.4);
  }

  useEffect(() => {
    if (state !== "run") return undefined;
    const iv = setInterval(() => {
      const w = world.current;
      if (!w) return;
      for (const lane of w.cars) {
        lane.xs = lane.xs.map((x) => {
          let nx = x + lane.speed * 3;
          if (nx > COLS + 1) nx = -2;
          if (nx < -2) nx = COLS + 1;
          return nx;
        });
        if (lane.y === w.frog.y && lane.xs.some((x) => Math.abs(x - w.frog.x) < 0.75)) {
          playSound("error", 0.5);
          setLives((l) => {
            const left = l - 1;
            if (left <= 0) {
              setState("dead");
              setScore((s) => {
                const b = Math.max(s, Number(localStorage.getItem("da-hopper-best") || 0));
                localStorage.setItem("da-hopper-best", String(b));
                setBest(b);
                return s;
              });
            }
            return left;
          });
          w.frog = { x: 6, y: 11 };
        }
      }
    }, 50);
    return () => clearInterval(iv);
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let raf;
    const draw = () => {
      const w = world.current;
      ctx.fillStyle = "#020703";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const road = "#0a130c";
      const safe = cssVar("--green-dark", "#0c2c12");
      for (let y = 0; y < ROWS; y += 1) {
        ctx.fillStyle = y === 0 || y === 6 || y === 11 ? safe : road;
        ctx.fillRect(0, y * CELL, COLS * CELL, CELL);
      }
      ctx.fillStyle = cssVar("--green-bright", "#5dff7d");
      ctx.font = "12px monospace";
      ctx.fillText("SAFE ZONE", 8, CELL - 12);
      if (w) {
        ctx.fillStyle = "#d9b13b";
        for (const lane of w.cars) {
          for (const x of lane.xs) {
            ctx.fillRect(x * CELL + 2, lane.y * CELL + 6, CELL * 1.4, CELL - 12);
          }
        }
        ctx.fillStyle = cssVar("--green-bright", "#5dff7d");
        ctx.beginPath();
        ctx.arc(w.frog.x * CELL + CELL / 2, w.frog.y * CELL + CELL / 2, CELL / 2 - 6, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  function onKey(e) {
    const moves = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
    if (moves[e.key]) {
      e.preventDefault();
      if (state !== "run") { start(); return; }
      const w = world.current;
      const [dx, dy] = moves[e.key];
      w.frog.x = Math.max(0, Math.min(COLS - 1, w.frog.x + dx));
      w.frog.y = Math.max(0, Math.min(ROWS - 1, w.frog.y + dy));
      playSound("toggle", 0.2);
      if (w.frog.y === 0) {
        setScore((s) => s + 100);
        playSound("confirm", 0.5);
        w.frog = { x: 6, y: 11 };
      }
    } else if (e.key === " " && state !== "run") {
      e.preventDefault();
      start();
    }
  }

  return (
    <div className="game-wrap">
      <div className="snake-hud">
        <span>SCORE :: {score}</span>
        <span>LIVES :: {"O".repeat(Math.max(0, lives))}</span>
        <span>BEST :: {best}</span>
        <span className="dim">{state === "run" ? "CROSS THE CONVOY LINES" : state === "dead" ? "FLATTENED :: SPACE" : "ARROWS / WASD TO START"}</span>
      </div>
      <canvas ref={canvasRef} className="snake-board" width={COLS * CELL} height={ROWS * CELL} tabIndex={0} onKeyDown={onKey} />
    </div>
  );
}
