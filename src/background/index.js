import { getSettingsForUrl } from '../utils/storage';
import { getScriptsForUrl } from '../scripts';

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only proceed if the page has completed loading
  if (changeInfo.status === 'complete' && tab.url) {
    try {
      // Get settings for this URL
      const settings = await getSettingsForUrl(tab.url);
      
      // Check if injection is enabled for this URL
      if (settings.enabled) {
        // Determine which scripts to inject
        const enabledScripts = Object.entries(settings.scripts)
          .filter(([_, enabled]) => enabled)
          .map(([scriptId]) => scriptId);
        
        // Get scripts that match the current URL
        const applicableScripts = enabledScripts.filter(scriptId => {
          return getScriptsForUrl(tab.url).includes(scriptId);
        });
        
        if (applicableScripts.length > 0) {
          // Inform content script which scripts to inject
          chrome.tabs.sendMessage(tabId, {
            action: 'injectScripts',
            scripts: enabledScripts // Send all enabled scripts, content will filter by URL
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error sending message to content script:", chrome.runtime.lastError);
            } else if (response) {
              console.log("Scripts injection response:", response);
            }
          });
          
          console.log(`Injecting scripts for ${tab.url}:`, applicableScripts);
        }
      }
    } catch (error) {
      console.error('Error handling tab update:', error);
    }
  }
});

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getActiveTabInfo') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs.length > 0) {
        const url = tabs[0].url;
        const settings = await getSettingsForUrl(url);
        const applicableScripts = getScriptsForUrl(url);
        
        sendResponse({
          url: url,
          settings: settings,
          applicableScripts: applicableScripts
        });
      } else {
        sendResponse({ error: 'No active tab found' });
      }
    });
    return true; // Required for async response
  }
  
  if (message.action === 'contentScriptLoaded') {
    console.log('Content script loaded for:', message.url);
    sendResponse({ acknowledged: true });
    return true;
  }
  
  // Allow disabling specific script
  if (message.action === 'disableScript') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'cleanupScript',
          scriptId: message.scriptId
        });
        sendResponse({ success: true });
      } else {
        sendResponse({ error: 'No active tab found' });
      }
    });
    return true;
  }
});

// Initialize extension on installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed');
  
  // Initialize settings
  const { getSettings } = await import('../utils/storage.js');
  await getSettings();
});
