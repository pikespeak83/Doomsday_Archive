import React, { useEffect, useState } from "react";
import TextType from "../reactbits/TextType.jsx";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/**
 * Shared OS chrome. `stats` is [{ label, on }]; the window buttons use
 * whichever bridge (archiveApi / fieldApi) is present. Close goes through
 * `onShutdown` so the CRT power-off animation can play first.
 */
export default function TopBar({ title = "DOOMSDAY ARCHIVE", stats = [], onShutdown }) {
  const now = useClock();
  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const bridge = window.archiveApi || window.fieldApi;

  return (
    <div className="topbar">
      <div className="topbar-left">
        <TextType text={title} typingSpeed={55} loop={false} cursorCharacter="_" />
      </div>
      <div className="topbar-right">
        {stats.map((stat) => (
          <span key={stat.label} className={`topbar-stat ${stat.on ? "" : "off"}`}>
            {stat.label}
          </span>
        ))}
        <span className="topbar-stat">{time}</span>
        <span className="winbtns">
          <button className="winbtn" onClick={() => bridge.minimize()}>_</button>
          <button className="winbtn" onClick={() => bridge.maximize()}>[]</button>
          <button
            className="winbtn close"
            onClick={() => (onShutdown ? onShutdown() : bridge.close())}
          >
            x
          </button>
        </span>
      </div>
    </div>
  );
}
