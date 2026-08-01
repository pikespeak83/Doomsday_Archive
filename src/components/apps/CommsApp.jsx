import React, { useEffect, useState } from "react";
import { playSound } from "../../lib/sounds.js";

const TABS = ["EMAIL", "RADIO", "INTERCEPTS", "SATELLITE"];

/** Coded-traffic heuristic for the intercept watch: callsigns, number
 * groups, bracket groups, or hot procedure words. */
function looksCoded(text) {
  const t = String(text || "");
  return /\b[A-Z]{3,}-\d{1,4}\b/.test(t)
    || /\b\d{5,}\b/.test(t)
    || /\[[^\]]{3,}\]/.test(t)
    || /\b(CODE|CIPHER|PROTOCOL|OMEGA|SIGMA|AUTHENTICATE|EXECUTE|FALLBACK|RENDEZVOUS)\b/i.test(t);
}

/** Communications hub: vault mail, radio stations, intercept log. */
export default function CommsApp({ notify, onOpenApp, lanState }) {
  const [tab, setTab] = useState("EMAIL");
  const [data, setData] = useState(null);
  const [reading, setReading] = useState(null);
  const [compose, setCompose] = useState(null); // { to, subject, body }
  const [tuned, setTuned] = useState(null);
  const [logging, setLogging] = useState(null); // { source, heard }
  const [sigint, setSigint] = useState([]); // coded traffic lifted from shelter chat

  useEffect(() => {
    window.archiveApi.getData("comms").then(setData);
  }, []);

  // Intercept watch: sweep the shelter chat for coded traffic while the tab is open.
  useEffect(() => {
    if (tab !== "INTERCEPTS" || !lanState?.running || !lanState?.hostToken) return undefined;
    let stopped = false;
    async function sweep() {
      try {
        const res = await fetch(`http://127.0.0.1:${lanState.port || 8737}/api/chat/messages?after=0`, {
          headers: { "x-archive-token": lanState.hostToken }
        });
        if (!res.ok || stopped) return;
        const body = await res.json();
        const coded = (body.messages || [])
          .filter((m) => m.text && looksCoded(m.text))
          .slice(-25)
          .map((m) => ({
            id: `sig-${m.seq ?? m.id}`,
            source: `SHELTER NET :: ${m.from?.name || "UNKNOWN STATION"}`,
            heard: m.text,
            time: m.time,
            sigint: true
          }));
        if (!stopped) setSigint(coded);
      } catch {
        // relay unreachable; manual log still works
      }
    }
    void sweep();
    const timer = setInterval(sweep, 15000);
    return () => { stopped = true; clearInterval(timer); };
  }, [tab, lanState?.running, lanState?.hostToken, lanState?.port]);

  async function save(next) {
    setData(next);
    await window.archiveApi.saveData("comms", next);
  }

  if (!data) return <div className="dim">OPENING CHANNELS...</div>;

  const emails = data.emails || [];
  const intercepts = data.intercepts || [];
  const stations = data.stations || [];

  async function sendMail() {
    if (!compose?.subject?.trim() && !compose?.body?.trim()) return setCompose(null);
    playSound("confirm", 0.5);
    const entry = {
      id: `e${Date.now()}`,
      from: "VAULT PRIME",
      to: compose.to?.trim() || "ALL STATIONS",
      subject: compose.subject?.trim() || "(no subject)",
      body: compose.body || "",
      time: Date.now(),
      read: true
    };
    await save({ ...data, emails: [entry, ...emails] });
    setCompose(null);
    notify?.("MESSAGE FILED TO THE VAULT MAIL LOG");
  }

  async function markRead(mail) {
    setReading(mail);
    if (!mail.read) {
      await save({ ...data, emails: emails.map((e) => (e.id === mail.id ? { ...e, read: true } : e)) });
    }
  }

  async function saveIntercept() {
    if (!logging?.heard?.trim()) return setLogging(null);
    playSound("select", 0.4);
    await save({
      ...data,
      intercepts: [{
        id: `i${Date.now()}`,
        source: logging.source?.trim() || "UNKNOWN",
        heard: logging.heard.trim(),
        time: Date.now()
      }, ...intercepts]
    });
    setLogging(null);
  }

  return (
    <div>
      <div className="app-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={`app-tab ${tab === t ? "on" : ""}`}
            onClick={() => { playSound("click", 0.3); setTab(t); setReading(null); }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "EMAIL" && !reading && !compose && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="field-label" style={{ marginTop: 0 }}>VAULT MAIL ({emails.filter((e) => !e.read).length} UNREAD)</div>
            <button className="btn small" onClick={() => setCompose({ to: "", subject: "", body: "" })}>COMPOSE</button>
          </div>
          <table className="data-table">
            <tbody>
              {emails.map((mail) => (
                <tr key={mail.id} style={{ cursor: "pointer" }} onClick={() => markRead(mail)}>
                  <td className={mail.read ? "dim" : "bright"} style={{ width: 130 }}>{mail.from}</td>
                  <td className={mail.read ? "" : "bright"}>{mail.subject}</td>
                  <td className="dim" style={{ width: 110, textAlign: "right" }}>
                    {mail.time ? new Date(mail.time).toLocaleDateString() : "ARCHIVED"}
                  </td>
                </tr>
              ))}
              {!emails.length && <tr><td className="dim">no traffic on record</td></tr>}
            </tbody>
          </table>
        </>
      )}

      {tab === "EMAIL" && reading && (
        <div>
          <button className="btn small ghost" onClick={() => setReading(null)}>&lt; BACK</button>
          <div className="field-label">{reading.subject}</div>
          <div className="dim" style={{ fontSize: 12 }}>
            FROM {reading.from} :: TO {reading.to}{reading.time ? ` :: ${new Date(reading.time).toLocaleString()}` : ""}
          </div>
          <p style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>{reading.body}</p>
        </div>
      )}

      {tab === "EMAIL" && compose && (
        <div>
          <div className="field-label" style={{ marginTop: 0 }}>NEW TRANSMISSION</div>
          <input className="text-input" style={{ width: "100%", marginBottom: 6 }} placeholder="TO (default: ALL STATIONS)"
            value={compose.to} onChange={(e) => setCompose({ ...compose, to: e.target.value })} />
          <input className="text-input" style={{ width: "100%", marginBottom: 6 }} placeholder="SUBJECT"
            value={compose.subject} onChange={(e) => setCompose({ ...compose, subject: e.target.value })} />
          <textarea className="text-input" style={{ width: "100%", height: 140, resize: "vertical" }} placeholder="MESSAGE BODY"
            value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn" onClick={sendMail}>FILE MESSAGE</button>
            <button className="btn ghost" onClick={() => setCompose(null)}>DISCARD</button>
          </div>
          <p className="dim" style={{ fontSize: 11, marginTop: 6 }}>
            No internet, no SMTP. Messages are filed in the vault mail log for anyone at this console.
          </p>
        </div>
      )}

      {tab === "RADIO" && (
        <>
          <div className="field-label" style={{ marginTop: 0 }}>RECEIVER :: {tuned ? `TUNED ${tuned.freq}` : "STANDBY"}</div>
          <table className="data-table">
            <tbody>
              {stations.map((st) => (
                <tr key={st.id}>
                  <td className="bright" style={{ width: 90 }}>{st.freq}</td>
                  <td>{st.name}</td>
                  <td className="dim">{st.note}</td>
                  <td style={{ width: 80, textAlign: "right" }}>
                    <button
                      className={`btn small ${tuned?.id === st.id ? "" : "ghost"}`}
                      onClick={() => {
                        playSound(tuned?.id === st.id ? "toggle" : "select", 0.4);
                        setTuned(tuned?.id === st.id ? null : st);
                      }}
                    >
                      {tuned?.id === st.id ? "MUTE" : "TUNE"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tuned && (
            <div style={{ marginTop: 10 }}>
              {tuned.file ? (
                <audio className="viewer-audio" src={`vault://file/${encodeURI(tuned.file)}`} controls autoPlay />
              ) : (
                <div className="radio-static">
                  <span className="sig-bars"><i /><i /><i /><i /><i /></span>
                  <span className="dim">CARRIER DETECTED :: NO PROGRAM AUDIO ASSIGNED</span>
                </div>
              )}
              <p className="dim" style={{ fontSize: 11, marginTop: 6 }}>
                Assign program audio: put a recording in the vault, then paste its archive path below.
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  className="text-input" style={{ flex: 1 }}
                  placeholder="src0/path/to/recording.mp3"
                  defaultValue={tuned.file}
                  onKeyDown={async (e) => {
                    if (e.key !== "Enter") return;
                    const file = e.currentTarget.value.trim();
                    const nextStations = stations.map((s) => (s.id === tuned.id ? { ...s, file } : s));
                    await save({ ...data, stations: nextStations });
                    setTuned({ ...tuned, file });
                    playSound("confirm", 0.5);
                  }}
                />
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            <button className="btn small ghost"
              onClick={() => window.archiveApi.openExternal("https://radio.garden/")}>
              OPEN EXTERNAL RADIO (GRID)
            </button>
            <button className="btn small ghost"
              onClick={() => window.archiveApi.openExternal("https://www.broadcastify.com/listen/")}>
              OPEN POLICE SCANNER (GRID)
            </button>
          </div>
          <p className="dim" style={{ fontSize: 11, marginTop: 4 }}>
            External receivers need the grid (internet). Vault program audio works offline.
          </p>
        </>
      )}

      {tab === "INTERCEPTS" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="field-label" style={{ marginTop: 0 }}>SIGNAL INTERCEPT LOG</div>
            <button className="btn small" onClick={() => { playSound("click", 0.3); setLogging({ source: "SHORTWAVE", heard: "" }); }}>LOG INTERCEPT</button>
          </div>
          {logging && (
            <div style={{ border: "1px solid var(--green-dim)", padding: 8, margin: "8px 0" }}>
              <input className="text-input" style={{ width: "100%", marginBottom: 6 }} placeholder="SOURCE (FREQUENCY / CHANNEL)"
                value={logging.source} onChange={(e) => setLogging({ ...logging, source: e.target.value })} />
              <textarea className="text-input" style={{ width: "100%", height: 70, resize: "vertical" }} placeholder="WHAT WAS HEARD"
                value={logging.heard} onChange={(e) => setLogging({ ...logging, heard: e.target.value })} />
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button className="btn small" onClick={saveIntercept}>FILE INTERCEPT</button>
                <button className="btn small ghost" onClick={() => setLogging(null)}>DISCARD</button>
              </div>
            </div>
          )}
          {sigint.length > 0 && (
            <p className="dim" style={{ fontSize: 11, margin: "6px 0" }}>
              INTERCEPT WATCH: {sigint.length} CODED TRANSMISSION{sigint.length === 1 ? "" : "S"} LIFTED FROM SHELTER NET TRAFFIC
            </p>
          )}
          {[...sigint].reverse().map((it) => (
            <div key={it.id} className="intercept sigint">
              <div className="dim" style={{ fontSize: 11 }}>
                <span className="sigint-tag">[SIGINT]</span> {it.source}{it.time ? ` :: ${new Date(it.time).toLocaleString()}` : ""}
              </div>
              <div style={{ marginTop: 3 }}>{it.heard}</div>
            </div>
          ))}
          {intercepts.map((it) => (
            <div key={it.id} className="intercept">
              <div className="dim" style={{ fontSize: 11 }}>
                {it.source}{it.time ? ` :: ${new Date(it.time).toLocaleString()}` : " :: RECOVERED"}
              </div>
              <div style={{ marginTop: 3 }}>{it.heard}</div>
            </div>
          ))}
          {!intercepts.length && !sigint.length && <p className="dim">airwaves quiet. for now.</p>}
          {(!lanState?.running || !lanState?.hostToken) && (
            <p className="dim" style={{ fontSize: 11 }}>
              INTERCEPT WATCH OFFLINE: start the uplink to sweep shelter chat for coded traffic.
            </p>
          )}
        </>
      )}

      {tab === "SATELLITE" && (
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <p className="dim">SATELLITE TRAFFIC IS HANDLED BY THE DEDICATED CONTROL CONSOLE.</p>
          <button className="btn" onClick={() => onOpenApp?.("satellite")}>OPEN SATELLITE CONTROL</button>
        </div>
      )}
    </div>
  );
}
