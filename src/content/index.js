import { loadScript, getScriptsForUrl } from '../scripts';

// Keep track of loaded scripts and their cleanups
const loadedScripts = new Map(); // scriptId -> { observer, cleanup }

// Function to inject applicable scripts based on URL and settings
const injectScripts = async (scriptIds) => {
  const currentUrl = window.location.href;
  console.log('URL:', currentUrl);
  console.log('Scripts to check:', scriptIds);
  
  // Get scripts that match the current URL
  const applicableScripts = scriptIds.filter(scriptId => {
    // Import inside the filter to avoid circular dependencies
    const { urlMatchesScript } = require('../scripts');
    return urlMatchesScript(currentUrl, scriptId);
  });
  
  console.log('Applicable scripts for this URL:', applicableScripts);
  
  for (const scriptId of applicableScripts) {
    // Skip already loaded scripts
    if (loadedScripts.has(scriptId)) {
      console.log(`Script ${scriptId} already loaded, skipping`);
      continue;
    }
    
    try {
      const result = await loadScript(scriptId);
      
      // Store any cleanup functions or observers for later use
      loadedScripts.set(scriptId, {
        observer: result.observer,
        cleanup: result.cleanup
      });
      
      console.log(`Successfully loaded script: ${scriptId}`);
    } catch (error) {
      console.error(`Failed to load script ${scriptId}:`, error);
    }
  }
};

// Clean up resources when navigating away or disabling scripts
const cleanupScript = (scriptId) => {
  const scriptData = loadedScripts.get(scriptId);
  if (scriptData) {
    if (scriptData.observer) {
      scriptData.observer.disconnect();
    }
    
    if (typeof scriptData.cleanup === 'function') {
      scriptData.cleanup();
    }
    
    loadedScripts.delete(scriptId);
    console.log(`Cleaned up script: ${scriptId}`);
  }
};

// Listen for script injection messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'injectScripts') {
    injectScripts(message.scripts)
      .then(() => {
        sendResponse({ 
          success: true, 
          loadedScripts: Array.from(loadedScripts.keys()) 
        });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Required for async response
  }
  
  // Handle script cleanup request
  if (message.action === 'cleanupScript') {
    cleanupScript(message.scriptId);
    sendResponse({ success: true });
  }
  
  // Handle script discovery request
  if (message.action === 'getAvailableScripts') {
    // Import here to avoid circular dependencies
    const { getAllScriptsFlat } = require('../scripts');
    const scripts = getAllScriptsFlat();
    sendResponse({ success: true, scripts });
  }
  
  // Handle URL-specific scripts request
  if (message.action === 'getScriptsForUrl') {
    const url = message.url || window.location.href;
    // Import here to avoid circular dependencies
    const { getScriptsForUrl } = require('../scripts');
    const scripts = getScriptsForUrl(url);
    sendResponse({ success: true, scripts });
  }
  
  return true; // Required for async response
});

// Notify background script that content script is loaded
chrome.runtime.sendMessage({
  action: 'contentScriptLoaded',
  url: window.location.href
});
