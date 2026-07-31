import React, { useState } from "react";
import { playSound } from "../../lib/sounds.js";
import SnakeApp from "./SnakeApp.jsx";
import MuncherApp from "./games/MuncherApp.jsx";
import HopperApp from "./games/HopperApp.jsx";
import TrailApp from "./games/TrailApp.jsx";

const GAMES = [
  { id: "serpent", name: "SERPENT.EXE", blurb: "Classic vault snake. Eat, grow, don't bite yourself.", comp: SnakeApp },
  { id: "muncher", name: "MUNCHER", blurb: "Clear the sector of ration dots. Evade the wraiths.", comp: MuncherApp },
  { id: "hopper", name: "HOPPER", blurb: "Cross the convoy lines without getting flattened.", comp: HopperApp },
  { id: "trail", name: "WASTELAND TRAIL", blurb: "2000 km to Sanctuary. Manage food, fuel, and luck.", comp: TrailApp }
];

/** GHOST GAMES: the archive's arcade cabinet. */
export default function GamesApp() {
  const [gameId, setGameId] = useState(null);
  const game = GAMES.find((g) => g.id === gameId);

  if (game) {
    const Game = game.comp;
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <button className="btn small ghost" onClick={() => { playSound("close", 0.4); setGameId(null); }}>
            {"<"} ARCADE
          </button>
          <span className="bright" style={{ letterSpacing: 3 }}>{game.name}</span>
        </div>
        <Game />
      </div>
    );
  }

  return (
    <div>
      <p className="dim" style={{ fontSize: 12, marginBottom: 10 }}>
        GHOST GAMES :: recreational software recovered from the old world. Morale is a survival resource.
      </p>
      <div className="games-grid">
        {GAMES.map((g) => (
          <button
            key={g.id}
            className="games-card"
            onClick={() => { playSound("open", 0.5); setGameId(g.id); }}
          >
            <div className="games-card-name">{g.name}</div>
            <div className="games-card-blurb">{g.blurb}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
