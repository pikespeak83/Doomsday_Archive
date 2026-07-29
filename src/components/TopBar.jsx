import React, { useEffect, useState } from "react";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function TopBar({ lanState }) {
  const now = useClock();
  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const running = Boolean(lanState?.running);
  const linked = Boolean(lanState?.archiveRoot);
  const devices = lanState?.approved?.length || 0;
  const pending = lanState?.pending?.length || 0;

  return (
    <div className="topbar">
      <div className="topbar-left">da_</div>
      <div className="topbar-right">
        <span className={`topbar-stat ${running ? "" : "off"}`} title="LAN uplink">
          {running ? "UPLINK:ON" : "UPLINK:OFF"}
        </span>
        <span className={`topbar-stat ${linked ? "" : "off"}`} title="Linked storage">
          {linked ? "VAULT:LINKED" : "VAULT:NONE"}
        </span>
        <span className={`topbar-stat ${pending ? "" : devices ? "" : "off"}`} title="Devices">
          DEV:{devices}{pending ? ` (+${pending}!)` : ""}
        </span>
        <span className="topbar-stat">{time}</span>
        <span className="winbtns">
          <button className="winbtn" onClick={() => window.archiveApi.minimize()}>_</button>
          <button className="winbtn" onClick={() => window.archiveApi.maximize()}>[]</button>
          <button className="winbtn close" onClick={() => window.archiveApi.close()}>x</button>
        </span>
      </div>
    </div>
  );
}
