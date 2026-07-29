import React, { useEffect, useState } from "react";
import { playSound } from "../../lib/sounds.js";

const TABS = ["EMAIL", "RADIO", "INTERCEPTS", "SATELLITE"];

/** Communications hub: vault mail, radio stations, intercept log. */
export default function CommsApp({ notify, onOpenApp }) {
  const [tab, setTab] = useState("EMAIL");
  const [data, setData] = useState(null);
  const [reading, setReading] = useState(null);
  const [compose, setCompose] = useState(null); // { to, subject, body }
  const [tuned, setTuned] = useState(null);

  useEffect(() => {
    window.archiveApi.getData("comms").then(setData);
  }, []);

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

  async function logIntercept() {
    const source = window.prompt("Source (frequency / channel):", "SHORTWAVE");
    if (source === null) return;
    const heard = window.prompt("What was heard:");
    if (!heard) return;
    playSound("select", 0.4);
    await save({
      ...data,
      intercepts: [{ id: `i${Date.now()}`, source: source || "UNKNOWN", heard, time: Date.now() }, ...intercepts]
    });
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
        </>
      )}

      {tab === "INTERCEPTS" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="field-label" style={{ marginTop: 0 }}>SIGNAL INTERCEPT LOG</div>
            <button className="btn small" onClick={logIntercept}>LOG INTERCEPT</button>
          </div>
          {intercepts.map((it) => (
            <div key={it.id} className="intercept">
              <div className="dim" style={{ fontSize: 11 }}>
                {it.source}{it.time ? ` :: ${new Date(it.time).toLocaleString()}` : " :: RECOVERED"}
              </div>
              <div style={{ marginTop: 3 }}>{it.heard}</div>
            </div>
          ))}
          {!intercepts.length && <p className="dim">airwaves quiet. for now.</p>}
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
