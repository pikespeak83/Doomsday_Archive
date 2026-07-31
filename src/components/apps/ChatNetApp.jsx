import React, { useEffect, useRef, useState } from "react";
import { playSound } from "../../lib/sounds.js";
import { fmtSize } from "./ArchiveApp.jsx";

/**
 * Shelter LAN chat shared by host and field terminals. Text plus image,
 * video, audio, and file drops. `base` + `token` point at the host node.
 */
export default function ChatNetApp({ base, token, selfId, onOpenMedia, notify }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const logRef = useRef(null);
  const latestRef = useRef(0);
  const fileRef = useRef(null);
  const stickRef = useRef(true);

  function headers(extra = {}) {
    return { "x-archive-token": token, ...extra };
  }

  async function poll(initial = false) {
    try {
      const res = await fetch(`${base}/api/chat/messages?after=${initial ? 0 : latestRef.current}`, { headers: headers() });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const body = await res.json();
      setError("");
      if (body.messages?.length) {
        latestRef.current = body.latest || latestRef.current;
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const fresh = body.messages.filter((m) => !seen.has(m.id));
          if (!fresh.length) return prev;
          return [...prev, ...fresh].slice(-300);
        });
      } else if (body.latest) {
        latestRef.current = body.latest;
      }
      // resync removals (deletes / host purge) on the periodic full fetch
      if (initial) setMessages(body.messages || []);
    } catch (err) {
      setError("RELAY UNREACHABLE");
    }
  }

  async function refetchAll() {
    try {
      const res = await fetch(`${base}/api/chat/messages?after=0`, { headers: headers() });
      if (!res.ok) return;
      const body = await res.json();
      latestRef.current = body.latest || 0;
      setMessages(body.messages || []);
    } catch {
      // relay unreachable; the regular poll will surface it
    }
  }

  useEffect(() => {
    void poll(true);
    const t = setInterval(() => void poll(), 2500);
    const full = setInterval(() => void refetchAll(), 12000);
    return () => { clearInterval(t); clearInterval(full); };
  }, [base, token]);

  useEffect(() => {
    if (stickRef.current) logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [messages]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft("");
    playSound("click", 0.35);
    try {
      const res = await fetch(`${base}/api/chat/send`, {
        method: "POST",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error("send failed");
      await poll();
    } catch {
      notify?.("TRANSMISSION FAILED", true);
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  async function attach(file) {
    if (!file) return;
    if (file.size > 24 * 1024 * 1024) {
      notify?.("ATTACHMENT TOO LARGE (24 MB MAX)", true);
      return;
    }
    setSending(true);
    playSound("select", 0.4);
    try {
      const text = draft.trim();
      const res = await fetch(
        `${base}/api/chat/upload?name=${encodeURIComponent(file.name)}&text=${encodeURIComponent(text)}`,
        { method: "POST", headers: headers({ "Content-Type": "application/octet-stream" }), body: file }
      );
      if (!res.ok) throw new Error("upload failed");
      setDraft("");
      await poll();
    } catch {
      notify?.("UPLOAD FAILED", true);
    } finally {
      setSending(false);
    }
  }

  function mediaUrl(media) {
    return `${base}/api/chat/media/${media.id}?token=${encodeURIComponent(token)}`;
  }

  async function deleteMessage(m) {
    playSound("toggle", 0.35);
    try {
      const res = await fetch(`${base}/api/chat/delete`, {
        method: "POST",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ seq: m.seq })
      });
      if (!res.ok) throw new Error();
      setMessages((prev) => prev.filter((x) => x.seq !== m.seq));
    } catch {
      notify?.("DELETE FAILED", true);
    }
  }

  async function clearAll() {
    playSound("error", 0.4);
    try {
      const res = await fetch(`${base}/api/chat/clear`, { method: "POST", headers: headers() });
      if (!res.ok) throw new Error();
      setMessages([]);
      notify?.("CHAT LOG PURGED");
    } catch {
      notify?.("PURGE FAILED", true);
    }
  }

  function openMedia(media) {
    if (!onOpenMedia) return;
    const kind = media.kind === "file" ? "binary" : media.kind;
    onOpenMedia({ kind, name: media.name, src: mediaUrl(media) });
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        attach(e.dataTransfer.files?.[0]);
      }}
    >
      {error && <p className="warn" style={{ marginBottom: 6 }}>{error}</p>}
      <div
        className="chatnet-log"
        ref={logRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
        }}
      >
        {messages.map((m) => (
          <div key={m.id} className="chatnet-msg">
            <div className="chatnet-head">
              <span className={`who ${m.from.id === selfId ? "bright" : ""}`}>
                {m.from.id === "host" ? `${m.from.name} [HOST]` : m.from.name}
              </span>
              {" :: "}
              {new Date(m.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {(m.from.id === selfId || selfId === "host") && (
                <button className="chatnet-del" title="Delete message" onClick={() => deleteMessage(m)}>[x]</button>
              )}
            </div>
            {m.text && <div className="chatnet-body">{m.text}</div>}
            {m.media && (
              <div className="chatnet-media">
                {m.media.kind === "image" && (
                  <img src={mediaUrl(m.media)} alt={m.media.name} onClick={() => openMedia(m.media)} />
                )}
                {m.media.kind === "video" && (
                  <video src={mediaUrl(m.media)} controls preload="metadata" />
                )}
                {m.media.kind === "audio" && (
                  <audio src={mediaUrl(m.media)} controls preload="metadata" />
                )}
                {m.media.kind === "file" && (
                  <button className="chatnet-file" onClick={() => openMedia(m.media)}>
                    [FILE] {m.media.name} ({fmtSize(m.media.size)})
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {!messages.length && !error && <div className="dim">channel open. say something.</div>}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          className="text-input"
          style={{ flex: 1 }}
          placeholder={sending ? "TRANSMITTING..." : "MESSAGE THE SHELTER NET"}
          value={draft}
          disabled={sending}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
        />
        <button className="btn small ghost" title="Attach file" onClick={() => fileRef.current?.click()}>+FILE</button>
        <button className="btn small" onClick={send} disabled={sending}>SEND</button>
        {selfId === "host" && (
          <button className="btn small danger" title="Purge the whole log for everyone" onClick={clearAll}>CLEAR ALL</button>
        )}
      </div>
      <p className="dim" style={{ fontSize: 11, marginTop: 6 }}>
        Drop a file anywhere in this window to transmit it. Media plays inline on every node.
      </p>
      <input
        ref={fileRef}
        type="file"
        style={{ display: "none" }}
        onChange={(e) => {
          attach(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
