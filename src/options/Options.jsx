import React, { useState, useEffect } from "react";
import { getSettings, saveSettings } from "../utils/storage";
import "./options.css";

const Options = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleResetSettings = async () => {
    if (window.confirm("Are you sure you want to reset all settings to default?")) {
      // Remove settings from storage to reset to default
      chrome.storage.local.remove("settings", async () => {
        // Reload default settings
        const data = await getSettings();
        setSettings(data);
        alert("Settings have been reset to default");
      });
    }
  };

  if (loading) {
    return <div className="options loading">Loading settings...</div>;
  }

  return (
    <div className="options">
      <h1>The Internet Usability Package(IUP) Options</h1>
      
      <div className="card">
        <h2>Settings Management</h2>
        
        <div className="settings-actions">
          <button onClick={() => {
            const dataStr = JSON.stringify(settings, null, 2);
            const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
            const exportLink = document.createElement("a");
            exportLink.setAttribute("href", dataUri);
            exportLink.setAttribute("download", "dynamic-script-injector-settings.json");
            exportLink.click();
          }} className="export-btn">
            Export Settings
          </button>
          
          <div className="import-container">
            <label className="import-btn">
              Import Settings
              <input 
                type="file" 
                accept=".json" 
                onChange={(event) => {
                  const file = event.target.files[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onload = async (e) => {
                    try {
                      const importedSettings = JSON.parse(e.target.result);
                      await saveSettings(importedSettings);
                      setSettings(importedSettings);
                      alert("Settings imported successfully");
                    } catch (error) {
                      alert("Error importing settings: " + error.message);
                    }
                  };
                  reader.readAsText(file);
                }} 
                style={{ display: "none" }} 
              />
            </label>
          </div>
          
          <button onClick={handleResetSettings} className="reset-btn">
            Reset to Default
          </button>
        </div>
      </div>
      
      <div className="card">
        <h2>Current Configuration</h2>
        
        {settings && (
          <div className="config-summary">
            <div className="summary-item">
              <span className="label">Global Settings:</span>
              <span className="value">
                {settings.globalSettings.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            
            <div className="summary-item">
              <span className="label">Domain Rules:</span>
              <span className="value">{settings.domainSettings.length}</span>
            </div>
            
            <div className="summary-item">
              <span className="label">Page Rules:</span>
              <span className="value">{settings.pageSettings.length}</span>
            </div>
            
            <div className="summary-item">
              <span className="label">Scripts Available:</span>
              <span className="value">
                {Object.keys(settings.globalSettings.scripts).length}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="card">
        <h2>Documentation</h2>
        
        <div className="documentation">
          <h3>About This Extension</h3>
          <p>
            The Internet Usability Package(IUP) allows you to modify the behavior of different websites
            to your liking and ways of working/surfing the web.
          </p>
          
          <h3>Settings Hierarchy</h3>
          <ul>
            <li>
              <strong>Global Settings:</strong> Applied to all websites unless overridden
            </li>
            <li>
              <strong>Domain Settings:</strong> Applied to specific domains, overriding global settings
            </li>
            <li>
              <strong>Page Settings:</strong> Applied to specific URLs, overriding both global and domain settings
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Options;
