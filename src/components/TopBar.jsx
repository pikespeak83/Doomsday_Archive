import React, { useEffect, useState } from "react";

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
 * whichever bridge (archiveApi / fieldApi) is present.
 */
export default function TopBar({ stats = [] }) {
  const now = useClock();
  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const bridge = window.archiveApi || window.fieldApi;

  return (
    <div className="topbar">
      <div className="topbar-left">da_</div>
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
          <button className="winbtn close" onClick={() => bridge.close()}>x</button>
        </span>
      </div>
    </div>
  );
}
