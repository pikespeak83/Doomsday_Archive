import React, { useEffect, useRef, useState } from "react";
import { playSound } from "../../../lib/sounds.js";

// 19x15: # wall, . dot, space empty
const MAZE = [
  "###################",
  "#........#........#",
  "#.##.###.#.###.##.#",
  "#.................#",
  "#.##.#.#####.#.##.#",
  "#....#...#...#....#",
  "####.### # ###.####",
  "   #.#       #.#   ",
  "####.# ## ## #.####",
  "#........#........#",
  "#.##.###.#.###.##.#",
  "#..#...........#..#",
  "##.#.#.#####.#.#.##",
  "#....#...#...#....#",
  "###################"
];
const CELL = 22;
const DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export default function MuncherApp() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("da-muncher-best") || 0));
  const [state, setState] = useState("ready"); // ready | run | dead | clear
  const world = useRef(null);

  function freshWorld() {
    return {
      grid: MAZE.map((row) => row.split("")),
      dots: MAZE.join("").split("").filter((c) => c === ".").length,
      player: { x: 9, y: 11, dir: [0, 0], want: [0, 0] },
      ghosts: [
        { x: 8, y: 7, dir: [1, 0], hue: 0 },
        { x: 9, y: 7, dir: [-1, 0], hue: 130 },
        { x: 10, y: 7, dir: [1, 0], hue: 210 }
      ],
      tick: 0
    };
  }

  function start() {
    world.current = freshWorld();
    setScore(0);
    setState("run");
    playSound("confirm", 0.4);
    canvasRef.current?.focus();
  }

  useEffect(() => {
    if (state !== "run") return undefined;
    const iv = setInterval(() => {
      const w = world.current;
      if (!w) return;
      w.tick += 1;
      const open = (x, y) => MAZE[(y + 15) % 15]?.[(x + 19) % 19] !== "#";
      const p = w.player;
      if (open(p.x + p.want[0], p.y + p.want[1])) p.dir = p.want;
      if (open(p.x + p.dir[0], p.y + p.dir[1])) {
        p.x = (p.x + p.dir[0] + 19) % 19;
        p.y = (p.y + p.dir[1] + 15) % 15;
      }
      if (w.grid[p.y][p.x] === ".") {
        w.grid[p.y][p.x] = " ";
        w.dots -= 1;
        setScore((s) => s + 10);
        if (w.dots <= 0) {
          setState("clear");
          playSound("confirm", 0.6);
        }
      }
      // ghosts: keep heading, prefer turns toward the player at junctions
      if (w.tick % 2 === 0) {
        for (const g of w.ghosts) {
          const options = Object.values({ u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] })
            .filter(([dx, dy]) => open(g.x + dx, g.y + dy) && !(dx === -g.dir[0] && dy === -g.dir[1]));
          if (options.length) {
            options.sort((A, B) => {
              const da = Math.abs(g.x + A[0] - p.x) + Math.abs(g.y + A[1] - p.y);
              const db = Math.abs(g.x + B[0] - p.x) + Math.abs(g.y + B[1] - p.y);
              return da - db;
            });
            g.dir = Math.random() < 0.75 ? options[0] : options[Math.floor(Math.random() * options.length)];
          } else {
            g.dir = [-g.dir[0], -g.dir[1]];
          }
          g.x = (g.x + g.dir[0] + 19) % 19;
          g.y = (g.y + g.dir[1] + 15) % 15;
        }
      }
      if (w.ghosts.some((g) => g.x === p.x && g.y === p.y)) {
        setState("dead");
        playSound("error", 0.5);
        setScore((s) => {
          const b = Math.max(s, Number(localStorage.getItem("da-muncher-best") || 0));
          localStorage.setItem("da-muncher-best", String(b));
          setBest(b);
          return s;
        });
      }
    }, 160);
    return () => clearInterval(iv);
  }, [state]);

  // render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let raf;
    const draw = () => {
      const w = world.current;
      ctx.fillStyle = "#020703";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const wall = cssVar("--green-dark", "#0c2c12");
      const dot = cssVar("--green", "#28c840");
      const me = cssVar("--green-bright", "#5dff7d");
      for (let y = 0; y < 15; y += 1) {
        for (let x = 0; x < 19; x += 1) {
          const c = w ? w.grid[y][x] : MAZE[y][x];
          if (c === "#") {
            ctx.fillStyle = wall;
            ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
          } else if (c === ".") {
            ctx.fillStyle = dot;
            ctx.fillRect(x * CELL + CELL / 2 - 2, y * CELL + CELL / 2 - 2, 4, 4);
          }
        }
      }
      if (w) {
        ctx.fillStyle = me;
        ctx.beginPath();
        ctx.arc(w.player.x * CELL + CELL / 2, w.player.y * CELL + CELL / 2, CELL / 2 - 3, 0.25 * Math.PI, 1.75 * Math.PI);
        ctx.lineTo(w.player.x * CELL + CELL / 2, w.player.y * CELL + CELL / 2);
        ctx.fill();
        for (const g of w.ghosts) {
          ctx.fillStyle = `hsl(${g.hue}, 80%, 60%)`;
          ctx.fillRect(g.x * CELL + 4, g.y * CELL + 4, CELL - 8, CELL - 8);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  function onKey(e) {
    if (DIRS[e.key]) {
      e.preventDefault();
      if (world.current) world.current.player.want = DIRS[e.key];
      if (state === "ready" || state === "dead" || state === "clear") start();
    } else if (e.key === " " && state !== "run") {
      e.preventDefault();
      start();
    }
  }

  return (
    <div className="game-wrap">
      <div className="snake-hud">
        <span>SCORE :: {score}</span>
        <span>BEST :: {best}</span>
        <span className="dim">{state === "run" ? "EVADE THE WRAITHS" : state === "clear" ? "SECTOR CLEARED :: SPACE" : state === "dead" ? "CAUGHT :: SPACE" : "ARROWS / WASD TO START"}</span>
      </div>
      <canvas ref={canvasRef} className="snake-board" width={19 * CELL} height={15 * CELL} tabIndex={0} onKeyDown={onKey} />
    </div>
  );
}
