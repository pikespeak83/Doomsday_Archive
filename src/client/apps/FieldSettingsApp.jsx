import React from "react";
import { setSoundsEnabled } from "../../lib/sounds.js";
import { Toggle } from "../../components/apps/SettingsApp.jsx";
import { THEME_CHOICES } from "../../lib/themes.js";

export default function FieldSettingsApp({ config, onConfigChange }) {
  async function save(partial) {
    const next = await window.fieldApi.saveConfig(partial);
    onConfigChange(next);
    return next;
  }

  return (
    <div>
      <div className="field-label">DEVICE NAME (SHOWN TO THE HOST)</div>
      <input
        className="text-input"
        value={config.deviceName || ""}
        maxLength={40}
        onChange={(e) => save({ deviceName: e.target.value })}
      />
      <p className="dim" style={{ fontSize: 12, marginTop: 6 }}>
        Applies the next time this device requests clearance.
      </p>

      <hr className="hr" />
      <div className="field-label">RETRIEVED FILES</div>
      <button className="btn" onClick={() => window.fieldApi.openDownloads()}>
        OPEN DOWNLOADS FOLDER
      </button>

      <hr className="hr" />
      <Toggle
        label="BOOT SEQUENCE ANIMATION"
        checked={config.bootAnimationEnabled !== false}
        onChange={(value) => save({ bootAnimationEnabled: value })}
      />
      <Toggle
        label="INTERFACE SOUNDS"
        checked={config.uiSoundsEnabled !== false}
        onChange={(value) => {
          setSoundsEnabled(value);
          return save({ uiSoundsEnabled: value });
        }}
      />

      <hr className="hr" />
      <div className="field-label">DESKTOP BACKDROP</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          ["map", "WORLD MAP"],
          ["emerald", "EMERALD MAP"],
          ["ember", "EMBER MAP"],
          ["crimson", "CRIMSON MAP"],
          ["onyx", "ONYX MAP"],
          ["circuit", "BLUE CIRCUIT"],
          ["gold", "GOLD GRID"],
          ["none", "PLAIN"]
        ].map(([value, label]) => (
          <button
            key={value}
            className={`btn small ${(config.desktopBackground || "map") === value ? "" : "ghost"}`}
            onClick={() => {
              const matched = BACKDROP_THEMES[value];
              void save({ desktopBackground: value, ...(matched ? { theme: matched } : {}) });
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="dim" style={{ fontSize: 12, marginTop: 6 }}>
        Picking a bundled map switches the whole interface style to match it.
      </p>

      <hr className="hr" />
      <div className="field-label">STYLES</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {THEME_CHOICES.map(([value, label]) => (
          <button
            key={value}
            className={`btn small ${(config.theme || "green") === value ? "" : "ghost"}`}
            onClick={() => save({ theme: value })}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Bundled backdrops force the matching style. */
const BACKDROP_THEMES = { emerald: "green", ember: "amber", crimson: "crimson", onyx: "mono", circuit: "cobalt", gold: "gold" };
