import React, { useEffect, useRef, useState } from "react";
import { playSound } from "../../lib/sounds.js";

/**
 * Camera net shared by host and field. Turn your camera on and it streams
 * to every connected node; the host can request a device's camera.
 * Frames travel as JPEG snapshots over the LAN (no internet, no WebRTC).
 */
export default function CameraNetApp({ base, token, selfId, isHost, devices = [], notify }) {
  const [feeds, setFeeds] = useState([]);
  const [requested, setRequested] = useState(false);
  const [mine, setMine] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const pushTimer = useRef(null);
  const mineRef = useRef(false);
  mineRef.current = mine;

  function headers(extra = {}) {
    return { "x-archive-token": token, ...extra };
  }

  async function poll() {
    try {
      const res = await fetch(`${base}/api/cam/list`, { headers: headers() });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const body = await res.json();
      setError("");
      setFeeds(body.feeds || []);
      setRequested(Boolean(body.requested));
    } catch {
      setError("CAMERA RELAY UNREACHABLE");
    }
  }

  useEffect(() => {
    void poll();
    const t = setInterval(() => void poll(), 3000);
    const frameTick = setInterval(() => setTick((v) => v + 1), 900);
    return () => {
      clearInterval(t);
      clearInterval(frameTick);
      stopCamera(false);
    };
  }, [base, token]);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        void videoRef.current.play().catch(() => {});
      }
      setMine(true);
      playSound("confirm", 0.5);
      const canvas = document.createElement("canvas");
      const push = async () => {
        if (!mineRef.current || !streamRef.current) return;
        const video = videoRef.current;
        if (video && video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext("2d").drawImage(video, 0, 0);
          const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.55));
          if (blob && mineRef.current) {
            try {
              await fetch(`${base}/api/cam/frame`, {
                method: "POST",
                headers: headers({ "Content-Type": "application/octet-stream" }),
                body: blob
              });
            } catch {
              // relay hiccup; next frame will retry
            }
          }
        }
        pushTimer.current = setTimeout(push, 700);
      };
      void push();
    } catch (err) {
      playSound("error", 0.5);
      notify?.(`CAMERA ERROR: ${String(err.message || err)}`, true);
    }
  }

  function stopCamera(announce = true) {
    clearTimeout(pushTimer.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (mineRef.current && announce) {
      playSound("toggle", 0.4);
      void fetch(`${base}/api/cam/stop`, { method: "POST", headers: headers() }).catch(() => {});
    }
    setMine(false);
  }

  async function requestCam(deviceId) {
    playSound("select", 0.4);
    await fetch(`${base}/api/cam/request`, {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ deviceId })
    }).catch(() => {});
    notify?.("CAMERA REQUEST TRANSMITTED");
  }

  async function decline() {
    setRequested(false);
    await fetch(`${base}/api/cam/decline`, { method: "POST", headers: headers() }).catch(() => {});
  }

  const others = feeds.filter((f) => f.id !== selfId);
  const streamingIds = new Set(feeds.map((f) => f.id));

  return (
    <div>
      {error && <p className="warn">{error}</p>}

      {requested && !mine && (
        <div className="intercept" style={{ borderLeftColor: "var(--red)" }}>
          <div className="warn" style={{ letterSpacing: 2 }}>HOST NODE REQUESTS YOUR CAMERA</div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn small" onClick={startCamera}>GO LIVE</button>
            <button className="btn small ghost" onClick={decline}>DECLINE</button>
          </div>
        </div>
      )}

      <div className="field-label" style={{ marginTop: 0 }}>MY CAMERA</div>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div className="camnet-tile" style={{ width: 240, aspectRatio: "4 / 3" }}>
          <video ref={videoRef} muted playsInline />
          {!mine && <div className="cam-dead">OFFLINE</div>}
          {mine && <span className="camnet-live">LIVE</span>}
          <span className="camnet-label">{isHost ? "HOST NODE" : "THIS TERMINAL"}</span>
        </div>
        <div>
          <button className={`btn ${mine ? "danger" : ""}`} onClick={() => (mine ? stopCamera() : startCamera())}>
            {mine ? "STOP BROADCAST" : "TURN CAMERA ON"}
          </button>
          <p className="dim" style={{ fontSize: 11, marginTop: 8, maxWidth: 280 }}>
            While live, every connected node (and the host) can watch this feed
            in their CAMERAS console.
          </p>
        </div>
      </div>

      <div className="field-label">LIVE FEEDS ({others.length})</div>
      <div className="camnet-grid">
        {others.map((feed) => (
          <div key={feed.id} className="camnet-tile">
            <img
              src={`${base}/api/cam/frame?feed=${encodeURIComponent(feed.id)}&token=${encodeURIComponent(token)}&t=${tick}`}
              alt={feed.name}
            />
            <span className="camnet-live">LIVE</span>
            <span className="camnet-label">{feed.id === "host" ? `${feed.name} [HOST]` : feed.name}</span>
          </div>
        ))}
        {!others.length && <p className="dim" style={{ gridColumn: "1 / -1" }}>no other cameras broadcasting.</p>}
      </div>

      {isHost && (
        <>
          <div className="field-label">REQUEST A DEVICE CAMERA</div>
          {devices.length === 0 && <p className="dim" style={{ fontSize: 12 }}>no cleared devices.</p>}
          {devices.map((d) => (
            <div key={d.id} className="obj-row">
              <span className={`status-led ${streamingIds.has(d.id) ? "ok" : ""}`} />
              <span>{d.name}</span>
              {streamingIds.has(d.id)
                ? <span className="dim" style={{ marginLeft: "auto" }}>BROADCASTING</span>
                : <button className="btn small ghost" style={{ marginLeft: "auto" }} onClick={() => requestCam(d.id)}>REQUEST CAM</button>}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
