import React, { useEffect, useRef, useState } from "react";
import { playSound } from "../../lib/sounds.js";

const COLS = 24;
const ROWS = 18;
const CELL = 18;

/** SERPENT.EXE: canvas snake with phosphor styling. Arrows/WASD, space to pause. */
export default function SnakeApp() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("da-snake-best") || 0));
  const [state, setState] = useState("ready"); // ready | running | paused | dead
  const gameRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  function freshGame() {
    return {
      snake: [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: { x: 16, y: 9 },
      grew: 0
    };
  }

  function placeFood(g) {
    let spot;
    do {
      spot = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (g.snake.some((s) => s.x === spot.x && s.y === spot.y));
    g.food = spot;
  }

  function start() {
    gameRef.current = freshGame();
    setScore(0);
    setState("running");
    playSound("confirm", 0.4);
  }

  useEffect(() => {
    function onKey(e) {
      const g = gameRef.current;
      const dirs = {
        ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }
      };
      const d = dirs[e.key];
      if (d && g && stateRef.current === "running") {
        if (d.x !== -g.dir.x || d.y !== -g.dir.y) g.nextDir = d;
        e.preventDefault();
      } else if (e.key === " ") {
        e.preventDefault();
        setState((s) => (s === "running" ? "paused" : s === "paused" ? "running" : s));
      } else if ((e.key === "Enter" || e.key === " ") && (stateRef.current === "ready" || stateRef.current === "dead")) {
        start();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;
    let last = 0;
    const styles = getComputedStyle(document.querySelector(".os-root") || document.body);
    const green = styles.getPropertyValue("--green").trim() || "#7dff3f";
    const bright = styles.getPropertyValue("--green-bright").trim() || "#b6ff6a";
    const red = styles.getPropertyValue("--red").trim() || "#ff5f4f";

    function tick(now) {
      raf = requestAnimationFrame(tick);
      if (stateRef.current !== "running") { draw(); return; }
      if (now - last < 110) return;
      last = now;
      const g = gameRef.current;
      g.dir = g.nextDir;
      const head = { x: g.snake[0].x + g.dir.x, y: g.snake[0].y + g.dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS ||
          g.snake.some((s) => s.x === head.x && s.y === head.y)) {
        playSound("error", 0.5);
        setState("dead");
        setBest((b) => {
          const nb = Math.max(b, scoreRef.current);
          localStorage.setItem("da-snake-best", String(nb));
          return nb;
        });
        return;
      }
      g.snake.unshift(head);
      if (head.x === g.food.x && head.y === g.food.y) {
        playSound("select", 0.35);
        setScore((v) => v + 10);
        placeFood(g);
      } else if (g.grew > 0) {
        g.grew -= 1;
      } else {
        g.snake.pop();
      }
      draw();
    }

    function draw() {
      ctx.fillStyle = "rgba(0, 6, 2, 0.92)";
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
      const g = gameRef.current;
      if (g) {
        ctx.fillStyle = red;
        ctx.fillRect(g.food.x * CELL + 3, g.food.y * CELL + 3, CELL - 6, CELL - 6);
        g.snake.forEach((seg, i) => {
          ctx.fillStyle = i === 0 ? bright : green;
          ctx.globalAlpha = i === 0 ? 1 : Math.max(0.35, 1 - i * 0.03);
          ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
        });
        ctx.globalAlpha = 1;
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const scoreRef = useRef(score);
  scoreRef.current = score;

  return (
    <div className="snake-wrap">
      <div className="snake-hud">
        <span>SCORE :: <span className="bright">{score}</span></span>
        <span className="dim">
          {state === "running" ? "SPACE TO PAUSE" : state === "paused" ? "PAUSED" : "ARROWS / WASD"}
        </span>
        <span>BEST :: <span className="bright">{best}</span></span>
      </div>
      <canvas ref={canvasRef} className="snake-board" width={COLS * CELL} height={ROWS * CELL} />
      {state !== "running" && (
        <div style={{ marginTop: 10 }}>
          {state === "dead" && <p className="warn" style={{ marginBottom: 8 }}>SERPENT TERMINATED.</p>}
          <button className="btn" onClick={start}>
            {state === "dead" ? "RESPAWN" : state === "paused" ? "RESUME (SPACE)" : "START"}
          </button>
        </div>
      )}
    </div>
  );
}
