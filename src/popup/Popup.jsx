import React, { useState, useEffect } from "react";
import { getSettings, saveSettings, getSettingsForUrl } from "../utils/storage";
import { getAvailableScripts, getScriptsForUrl } from "../scripts";
import "./popup.css";

const Popup = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentTabSettings, setCurrentTabSettings] = useState(null);
  const [activeTab, setActiveTab] = useState("current");
  const [newUrlPattern, setNewUrlPattern] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [availableScripts, setAvailableScripts] = useState({});
  const [applicableScripts, setApplicableScripts] = useState([]);
  const [expandedDomains, setExpandedDomains] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get all settings
        const allSettings = await getSettings();
        setSettings(allSettings);

        // Get script registry
        const scriptsRegistry = getAvailableScripts();
        setAvailableScripts(scriptsRegistry);

        // Initialize expanded state for domains
        const expanded = {};
        Object.keys(scriptsRegistry).forEach(domain => {
          expanded[domain] = false;
        });
        setExpandedDomains(expanded);

        // Get current tab info
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
          if (tabs.length > 0) {
            const url = tabs[0].url;
            setCurrentUrl(url);
            
            // Get specific settings for this URL
            const tabSettings = await getSettingsForUrl(url);
            setCurrentTabSettings(tabSettings);
            
            // Get scripts applicable to this URL
            const scripts = getScriptsForUrl(url);
            setApplicableScripts(scripts);
            
            // Expand domains that have applicable scripts
            const newExpanded = { ...expanded };
            scripts.forEach(scriptId => {
              const domainPart = scriptId.split('.')[0];
              newExpanded[domainPart] = true;
            });
            setExpandedDomains(newExpanded);
          }
          setLoading(false);
        });
      } catch (error) {
        console.error("Error loading settings:", error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleScriptToggle = async (scriptId) => {
    const updatedSettings = { ...settings };
    
    // Toggle in global settings
    updatedSettings.globalSettings.scripts[scriptId] = 
      !updatedSettings.globalSettings.scripts[scriptId];
    
    await saveSettings(updatedSettings);
    setSettings(updatedSettings);
    
    // If disabling, clean up the script in the active tab
    if (!updatedSettings.globalSettings.scripts[scriptId]) {
      chrome.runtime.sendMessage({
        action: 'disableScript',
        scriptId: scriptId
      });
    }
  };

  const toggleDomainExpand = (domain) => {
    setExpandedDomains({
      ...expandedDomains,
      [domain]: !expandedDomains[domain]
    });
  };

  const extractDomain = (url) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url;
    }
  };

  const isScriptApplicable = (scriptId) => {
    return applicableScripts.includes(scriptId);
  };

  if (loading) {
    return <div className="popup loading">Loading...</div>;
  }

  return (
    <div className="popup">
      <h1>Dynamic Script Injector</h1>
      
      <div className="current-page">
        <h2>Current Page</h2>
        <div className="url">{currentUrl}</div>
        
        {currentTabSettings && (
          <div className="current-settings">
            <p>Using {currentTabSettings.source} settings</p>
            <div className="status">
              Status: {currentTabSettings.enabled ? 
                <span className="enabled">Enabled</span> : 
                <span className="disabled">Disabled</span>}
            </div>
          </div>
        )}
      </div>
      
      <div className="tabs">
        <button 
          className={activeTab === "current" ? "active" : ""} 
          onClick={() => setActiveTab("current")}
        >
          Available Scripts
        </button>
        <button 
          className={activeTab === "all" ? "active" : ""} 
          onClick={() => setActiveTab("all")}
        >
          All Scripts
        </button>
        <button 
          className={activeTab === "settings" ? "active" : ""} 
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === "current" && (
          <div className="current-scripts">
            <h3>Scripts Available for This Page</h3>
            
            {applicableScripts.length === 0 ? (
              <p className="no-scripts">No scripts available for this URL.</p>
            ) : (
              <div className="scripts-list">
                {applicableScripts.map(scriptId => {
                  // Find the script in our flattened registry
                  const parts = scriptId.split('.');
                  const domainKey = parts[0];
                  const pageKey = parts[1];
                  const featureKey = parts[2];
                  
                  const domain = availableScripts[domainKey];
                  const page = domain?.pages[pageKey];
                  const script = page?.features[featureKey];
                  
                  if (!script) return null;
                  
                  const isEnabled = settings.globalSettings.scripts[scriptId];
                  
                  return (
                    <div key={scriptId} className="script-item">
                      <div className="script-header">
                        <div className="script-info">
                          <div className="script-name">{script.name}</div>
                          <div className="script-domain">{domain.name} &gt; {page.name}</div>
                        </div>
                        <div className="script-toggle">
                          <label className="switch">
                            <input 
                              type="checkbox" 
                              checked={isEnabled} 
                              onChange={() => handleScriptToggle(scriptId)} 
                            />
                            <span className="slider round"></span>
                          </label>
                        </div>
                      </div>
                      <p className="script-description">{script.description}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        
        {activeTab === "all" && (
          <div className="all-scripts">
            <h3>All Available Scripts</h3>
            
            {Object.entries(availableScripts).map(([domainKey, domain]) => (
              <div key={domainKey} className="domain-section">
                <div 
                  className="domain-header" 
                  onClick={() => toggleDomainExpand(domainKey)}
                >
                  <span className="domain-name">{domain.name}</span>
                  <span className="expand-icon">
                    {expandedDomains[domainKey] ? '▼' : '►'}
                  </span>
                </div>
                
                {expandedDomains[domainKey] && (
                  <div className="domain-content">
                    {Object.entries(domain.pages).map(([pageKey, page]) => (
                      <div key={pageKey} className="page-section">
                        <div className="page-header">{page.name}</div>
                        
                        <div className="page-scripts">
                          {Object.entries(page.features).map(([featureKey, script]) => {
                            const scriptId = script.id;
                            const isEnabled = settings.globalSettings.scripts[scriptId];
                            const isRelevant = isScriptApplicable(scriptId);
                            
                            return (
                              <div 
                                key={scriptId} 
                                className={`script-item ${isRelevant ? 'relevant' : ''}`}
                              >
                                <div className="script-header">
                                  <div className="script-info">
                                    <div className="script-name">
                                      {script.name}
                                      {isRelevant && (
                                        <span className="relevant-badge">
                                          Applicable
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="script-toggle">
                                    <label className="switch">
                                      <input 
                                        type="checkbox" 
                                        checked={isEnabled} 
                                        onChange={() => handleScriptToggle(scriptId)} 
                                      />
                                      <span className="slider round"></span>
                                    </label>
                                  </div>
                                </div>
                                <p className="script-description">{script.description}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {activeTab === "settings" && (
          <div className="settings-tab">
            <h3>Extension Settings</h3>
            
            <div className="setting-item">
              <label className="setting-label">
                <input 
                  type="checkbox" 
                  checked={settings.globalSettings.enabled} 
                  onChange={async () => {
                    const updatedSettings = { ...settings };
                    updatedSettings.globalSettings.enabled = !updatedSettings.globalSettings.enabled;
                    await saveSettings(updatedSettings);
                    setSettings(updatedSettings);
                  }} 
                />
                Enable Extension Globally
              </label>
            </div>
            
            {/* Add more global settings as needed */}
            
            <h3>Page Rules</h3>
            <p className="help-text">
              Page rules allow you to override settings for specific URLs.
            </p>
            
            {settings.pageSettings.length === 0 ? (
              <p>No page rules configured.</p>
            ) : (
              <ul className="rules-list">
                {settings.pageSettings.map((pageSetting, index) => (
                  <li key={index} className="rule-item">
                    <div className="rule-header">
                      <div className="pattern">{pageSetting.urlPattern}</div>
                      <div className="controls">
                        <label className="toggle">
                          <input 
                            type="checkbox" 
                            checked={pageSetting.enabled} 
                            onChange={async () => {
                              const updatedSettings = { ...settings };
                              updatedSettings.pageSettings[index].enabled = 
                                !updatedSettings.pageSettings[index].enabled;
                              await saveSettings(updatedSettings);
                              setSettings(updatedSettings);
                            }} 
                          />
                          <span className="toggle-label">
                            {pageSetting.enabled ? "Enabled" : "Disabled"}
                          </span>
                        </label>
                        <button 
                          className="delete-btn" 
                          onClick={async () => {
                            const updatedSettings = { ...settings };
                            updatedSettings.pageSettings.splice(index, 1);
                            await saveSettings(updatedSettings);
                            setSettings(updatedSettings);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            {showAddForm ? (
              <div className="add-form">
                <input 
                  type="text" 
                  placeholder="URL pattern (e.g., https://example.com/page*)" 
                  value={newUrlPattern} 
                  onChange={(e) => setNewUrlPattern(e.target.value)} 
                />
                <div className="form-actions">
                  <button onClick={async () => {
                    if (!newUrlPattern.trim()) {
                      alert("Please enter a URL pattern");
                      return;
                    }
                    
                    const updatedSettings = { ...settings };
                    const newRule = {
                      urlPattern: newUrlPattern,
                      scripts: { ...settings.globalSettings.scripts },
                      enabled: true
                    };
                    
                    updatedSettings.pageSettings.push(newRule);
                    await saveSettings(updatedSettings);
                    setSettings(updatedSettings);
                    setNewUrlPattern("");
                    setShowAddForm(false);
                  }}>Add Rule</button>
                  <button className="cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="add-btn" onClick={() => setShowAddForm(true)}>
                Add Page Rule
              </button>
            )}
            
            <div className="actions">
              <button className="add-current" onClick={() => {
                setNewUrlPattern(currentUrl);
                setShowAddForm(true);
              }}>
                Add Rule for Current Page
              </button>
              <button className="add-current-domain" onClick={() => {
                setNewUrlPattern(extractDomain(currentUrl));
                setShowAddForm(true);
              }}>
                Add Rule for Current Domain
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;
