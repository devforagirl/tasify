import React, { useEffect, useState } from "react";
import {
  FONT_SIZE_OPTIONS,
  DEFAULT_FONT_SIZE,
  NOTIFY_EVENTS,
  DEFAULT_NOTIFY_PREFS,
  STORAGE_KEYS,
  type NotifyEventKey,
} from "./defaults";

type NotifyPrefs = Record<NotifyEventKey, boolean>;

function App() {
  const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);
  const [notifyPrefs, setNotifyPrefs] = useState<NotifyPrefs>(DEFAULT_NOTIFY_PREFS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const result = await chrome.storage.sync.get([STORAGE_KEYS.FONT_SIZE, STORAGE_KEYS.NOTIFY_PREFS]);
      if (typeof result[STORAGE_KEYS.FONT_SIZE] === "number") {
        setFontSize(result[STORAGE_KEYS.FONT_SIZE] as number);
      }
      if (result[STORAGE_KEYS.NOTIFY_PREFS]) {
        setNotifyPrefs({ ...DEFAULT_NOTIFY_PREFS, ...(result[STORAGE_KEYS.NOTIFY_PREFS] as Partial<NotifyPrefs>) });
      }
      setLoaded(true);
    })();
  }, []);

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = Number(e.target.value);
    setFontSize(val);
    chrome.storage.sync.set({ [STORAGE_KEYS.FONT_SIZE]: val });
  };

  const handleNotifyToggle = (key: NotifyEventKey) => {
    const next = { ...notifyPrefs, [key]: !notifyPrefs[key] };
    setNotifyPrefs(next);
    chrome.storage.sync.set({ [STORAGE_KEYS.NOTIFY_PREFS]: next });
  };

  if (!loaded) return null;

  return (
    <div className="container">
      {/* Brand */}
      <div className="brand">
        <img src="/icons/48.png" alt="Tasify" />
        <h1>Tasify Settings</h1>
      </div>

      {/* Font size */}
      <div className="card">
        <div className="card-title">Display</div>
        <div className="form-group">
          <label className="form-label" htmlFor="font-size">Font Size</label>
          <select
            id="font-size"
            className="form-select"
            value={fontSize}
            onChange={handleFontSizeChange}
          >
            {FONT_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
          <p className="form-hint">Adjust the font size of all text in the popup window</p>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="card">
        <div className="card-title">Notifications</div>
        <p className="form-hint" style={{ marginBottom: "0.5rem" }}>
          Choose which events trigger a system notification
        </p>
        {NOTIFY_EVENTS.map((ev) => (
          <div key={ev.key} className="toggle-group">
            <input
              type="checkbox"
              className="toggle-checkbox"
              id={`notify-${ev.key}`}
              checked={notifyPrefs[ev.key]}
              onChange={() => handleNotifyToggle(ev.key)}
            />
            <div className="toggle-content">
              <label className="toggle-label" htmlFor={`notify-${ev.key}`}>
                {ev.label}
              </label>
              <p className="toggle-desc">{ev.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="option-footer">Tasify v1.0.0</div>
    </div>
  );
}

export default App;
