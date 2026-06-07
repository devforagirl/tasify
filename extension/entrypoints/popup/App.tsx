import React, { useEffect, useState } from "react";
import { useClaudeDashboard } from "./services/useClaudeDashboard";
import EventTerminal from "./components/EventTerminal";
import ControlPanel from "./components/ControlPanel";
import { DEFAULT_FONT_SIZE, STORAGE_KEYS } from "../options/defaults";

function App() {
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const {
    events,
    connectionStatus,
    error,
    connectHost,
    disconnectHost,
    isConnected,
  } = useClaudeDashboard();

  useEffect(() => {
    chrome.storage.sync.get(STORAGE_KEYS.FONT_SIZE).then((result) => {
      if (typeof result[STORAGE_KEYS.FONT_SIZE] === "number") {
        setFontSize(result[STORAGE_KEYS.FONT_SIZE] as number);
      }
    });
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes[STORAGE_KEYS.FONT_SIZE]) {
        setFontSize(changes[STORAGE_KEYS.FONT_SIZE].newValue as number);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // Apply font size to html element so rem units scale
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  return (
    <div className="flex flex-col bg-cream" style={{ minHeight: "400px", height: "100vh" }}>
      <ControlPanel
        onStart={connectHost}
        onStop={disconnectHost}
        isConnected={isConnected}
        error={error}
      />

      {error && (
        <div className="mx-2 mt-2 bg-severity-error border border-accent/30 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-severity-error shrink-0" />
          <p className="text-xs font-medium text-severity-error">{error}</p>
        </div>
      )}

      <div className="flex-1 p-2 pt-2 overflow-hidden">
        <EventTerminal events={events} />
      </div>

      <div className="footer">
        <span>Tasify v1.0.0</span>
      </div>
    </div>
  );
}

export default App;
