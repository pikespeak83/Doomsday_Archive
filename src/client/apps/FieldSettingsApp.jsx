import React from "react";
import { setSoundsEnabled } from "../../lib/sounds.js";
import { Toggle } from "../../components/apps/SettingsApp.jsx";

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
    </div>
  );
}
