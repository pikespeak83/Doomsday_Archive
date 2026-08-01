import React, { useCallback, useEffect, useRef, useState } from "react";
import { playSound } from "../../lib/sounds.js";

/**
 * BROADCAST: retro TV tuned to the Broadcast Pack channels. Playback position
 * is derived from the wall clock so every channel behaves like a live signal;
 * everyone watching the same channel sees the same moment.
 */
export default function TvApp({ base, token, isHost, notify }) {
  const [pack, setPack] = useState(null);
  const [chIdx, setChIdx] = useState(0);
  const [power, setPower] = useState(true);
  const [statik, setStatik] = useState(false);
  const [osd, setOsd] = useState(null);
  const [retrieving, setRetrieving] = useState(false);
  const [muted, setMuted] = useState(false);
  const [card, setCard] = useState(null); // interstitial test card gif
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const osdTimer = useRef(null);
  const staticTimer = useRef(null);
  const cardTimer = useRef(null);
  const playingRef = useRef(null); // episode id currently loaded

  const q = `token=${encodeURIComponent(token || "")}`;
  const fileUrl = (rel) => `${base}/api/pack/file?rel=${encodeURIComponent(rel)}&${q}`;

  const loadManifest = useCallback(async () => {
    try {
      const res = await fetch(`${base}/api/pack/manifest?${q}`);
      setPack(await res.json());
    } catch {
      setPack({ installed: false });
    }
  }, [base, token]);

  useEffect(() => { void loadManifest(); }, [loadManifest]);

  const channels = pack?.installed ? pack.channels || [] : [];
  const channel = channels[chIdx] || null;

  function livePosition(ch) {
    const total = ch.episodes.reduce((n, e) => n + (e.duration || 1), 0) || 1;
    let t = Math.floor(Date.now() / 1000) % total;
    for (const ep of ch.episodes) {
      if (t < (ep.duration || 1)) return { ep, offset: t };
      t -= ep.duration || 1;
    }
    return { ep: ch.episodes[0], offset: 0 };
  }

  function showOsd(ch, ep) {
    setOsd({ num: ch.num, name: ch.name, title: ep?.title || "" });
    clearTimeout(osdTimer.current);
    osdTimer.current = setTimeout(() => setOsd(null), 3200);
  }

  const syncToLive = useCallback(() => {
    const video = videoRef.current;
    if (!video || !channel || !power) return;
    const { ep, offset } = livePosition(channel);
    if (playingRef.current !== ep.id) {
      playingRef.current = ep.id;
      video.src = fileUrl(ep.file);
      video.currentTime = offset;
      void video.play().catch(() => {});
      showOsd(channel, ep);
    } else if (Math.abs(video.currentTime - offset) > 8) {
      video.currentTime = offset;
    }
  }, [channel, power, base, token]);

  // tune on channel/power change, then keep the signal live
  useEffect(() => {
    if (!channel || !power) return undefined;
    syncToLive();
    const iv = setInterval(syncToLive, 2000);
    return () => clearInterval(iv);
  }, [channel, power, syncToLive]);

  // static burst covers every tune, followed by a station test card
  function burst() {
    playSound("glitch", 0.4);
    setStatik(true);
    clearTimeout(staticTimer.current);
    staticTimer.current = setTimeout(() => setStatik(false), 520);
    setCard(fileUrl(`test-card-${1 + Math.floor(Math.random() * 3)}.gif`));
    clearTimeout(cardTimer.current);
    cardTimer.current = setTimeout(() => setCard(null), 1900);
  }

  function tune(nextIdx) {
    if (!channels.length) return;
    const idx = (nextIdx + channels.length) % channels.length;
    burst();
    playingRef.current = null;
    setChIdx(idx);
  }

  function togglePower() {
    burst();
    setPower((p) => !p);
    playingRef.current = null;
  }

  // noise canvas while static or power-off
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || (!statik && power)) return undefined;
    const ctx = canvas.getContext("2d");
    let raf;
    const draw = () => {
      const { width: w, height: h } = canvas;
      const img = ctx.createImageData(w, h);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [statik, power]);

  function onKey(e) {
    if (e.key === "ArrowUp") { e.preventDefault(); tune(chIdx + 1); }
    else if (e.key === "ArrowDown") { e.preventDefault(); tune(chIdx - 1); }
    else if (/^[1-9]$/.test(e.key)) {
      const idx = channels.findIndex((c) => c.num === Number(e.key));
      if (idx !== -1) tune(idx);
    }
  }

  async function retrieve() {
    playSound("confirm", 0.5);
    setRetrieving(true);
    notify?.("RETRIEVING BROADCAST ARCHIVE FROM THE GRID...");
    const res = await window.archiveApi.installPack();
    setRetrieving(false);
    if (res.ok) {
      notify?.("BROADCAST ARCHIVE INSTALLED. SIGNAL UP.");
      await loadManifest();
    } else {
      notify?.(`RETRIEVAL FAILED: ${String(res.error || "grid unreachable").toUpperCase()}`, true);
    }
  }

  if (!pack) return <p className="dim">TUNING...</p>;

  if (!pack.installed) {
    return (
      <div className="tv-nocarrier">
        <div className="tv-nocarrier-text">NO CARRIER</div>
        {isHost ? (
          <>
            <p className="dim" style={{ fontSize: 12, margin: "10px 0" }}>
              The broadcast archive is not on this node. Retrieval needs the grid
              (internet) once; afterwards every terminal in the shelter can tune in.
            </p>
            <button className="btn" onClick={retrieve} disabled={retrieving}>
              {retrieving ? "RETRIEVING SIGNAL..." : "RETRIEVE BROADCAST ARCHIVE (~280 MB)"}
            </button>
          </>
        ) : (
          <p className="dim" style={{ fontSize: 12, marginTop: 10 }}>
            HOST NODE HAS NO BROADCAST ARCHIVE. ASK THE HOST TO RETRIEVE IT.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="tv-shell" tabIndex={0} onKeyDown={onKey}>
      <div className="tv-screen">
        <video
          ref={videoRef}
          className="tv-video"
          muted={muted}
          style={{ opacity: power && !statik ? 1 : 0 }}
        />
        <canvas
          ref={canvasRef}
          className="tv-static"
          width={160}
          height={120}
          style={{ opacity: statik || !power ? (power ? 0.9 : 0.35) : 0 }}
        />
        {card && power && (
          <img
            className="tv-card"
            src={card}
            alt=""
            style={{ opacity: statik ? 0 : 1 }}
            onError={() => setCard(null)}
          />
        )}
        {!power && <div className="tv-off-dot" />}
        <div className="tv-scanlines" />
        {osd && power && (
          <div className="tv-osd">
            <span className="tv-osd-ch">CH-{osd.num}</span>
            <span>{osd.name}</span>
            <span className="tv-osd-title">{osd.title}</span>
          </div>
        )}
        <div className="tv-live">{power ? "LIVE" : "STANDBY"}</div>
      </div>
      <div className="tv-controls">
        <button className="btn small" onClick={togglePower}>{power ? "POWER OFF" : "POWER ON"}</button>
        <button className="btn small" onClick={() => tune(chIdx - 1)} disabled={!power}>CH-</button>
        <button className="btn small" onClick={() => tune(chIdx + 1)} disabled={!power}>CH+</button>
        <button className="btn small" onClick={() => setMuted((m) => !m)} disabled={!power}>
          {muted ? "UNMUTE" : "MUTE"}
        </button>
        <div className="tv-dial">
          {channels.map((c, i) => (
            <button
              key={c.id}
              className={`btn small ${i === chIdx && power ? "" : "ghost"}`}
              onClick={() => tune(i)}
              disabled={!power}
            >
              {c.num} :: {c.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
