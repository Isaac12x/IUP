import { getAllScriptsFlat } from '../scripts';

// Get all settings from storage
export const getSettings = async () => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], async (result) => {
      // Get all available scripts
      const scriptsList = getAllScriptsFlat();
      
      if (result.settings) {
        // Ensure all scripts are represented in the settings
        const updatedSettings = { ...result.settings };
        
        // Make sure we have scripts in global settings
        if (!updatedSettings.globalSettings.scripts) {
          updatedSettings.globalSettings.scripts = {};
        }
        
        // Add any missing scripts
        scriptsList.forEach(script => {
          if (updatedSettings.globalSettings.scripts[script.id] === undefined) {
            updatedSettings.globalSettings.scripts[script.id] = true; // Enable by default
          }
        });
        
        // Save updated settings if changed
        if (JSON.stringify(updatedSettings) !== JSON.stringify(result.settings)) {
          chrome.storage.local.set({ settings: updatedSettings });
        }
        
        resolve(updatedSettings);
      } else {
        // Default settings if none exist
        const defaultScripts = {};
        scriptsList.forEach(script => {
          defaultScripts[script.id] = true; // Enable all scripts by default
        });
        
        const defaultSettings = {
          globalSettings: {
            scripts: defaultScripts,
            enabled: true
          },
          domainSettings: [],
          pageSettings: []
        };
        
        // Save default settings
        chrome.storage.local.set({ settings: defaultSettings });
        resolve(defaultSettings);
      }
    });
  });
};

// Save updated settings
export const saveSettings = async (settings) => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ settings }, () => {
      resolve();
    });
  });
};

// Match URL against pattern
export const matchUrlPattern = (url, pattern) => {
  // If pattern is a regex string (starts and ends with /)
  if (typeof pattern === 'string' && pattern.startsWith('/') && 
      pattern.lastIndexOf('/') > 0) {
    const regexParts = pattern.split('/');
    const regexPattern = regexParts.slice(1, -1).join('/');
    const flags = regexParts[regexParts.length - 1];
    return new RegExp(regexPattern, flags).test(url);
  }
  
  // If pattern is a string with wildcards
  if (typeof pattern === 'string' && pattern.includes('*')) {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*');
    return new RegExp(`^${regexPattern}$`).test(url);
  }
  
  // If pattern is a plain string, check if URL contains it
  if (typeof pattern === 'string') {
    return url.includes(pattern);
  }
  
  // If pattern is already a RegExp object
  if (pattern instanceof RegExp) {
    return pattern.test(url);
  }
  
  return false;
};

// Get settings for a specific URL
export const getSettingsForUrl = async (url) => {
  const settings = await getSettings();
  
  // Start with global settings as default
  let effectiveSettings = {
    ...settings.globalSettings,
    source: 'global'
  };
  
  // Try to parse the URL
  let urlObj;
  try {
    urlObj = new URL(url);
  } catch (e) {
    console.error('Invalid URL:', url);
    return effectiveSettings;
  }
  
  const domain = urlObj.hostname;
  
  // Check for domain level matches (most specific first)
  const domainMatches = settings.domainSettings.filter(ds => {
    return matchUrlPattern(domain, ds.urlPattern);
  });
  
  if (domainMatches.length > 0) {
    // Sort by specificity (most specific first)
    domainMatches.sort((a, b) => {
      return b.urlPattern.length - a.urlPattern.length;
    });
    
    // Apply domain level settings
    effectiveSettings = {
      ...effectiveSettings,
      ...domainMatches[0],
      source: 'domain'
    };
  }
  
  // Check for page level matches (most specific first)
  const pageMatches = settings.pageSettings.filter(ps => {
    return matchUrlPattern(url, ps.urlPattern);
  });
  
  if (pageMatches.length > 0) {
    // Sort by specificity (most specific first)
    pageMatches.sort((a, b) => {
      return b.urlPattern.length - a.urlPattern.length;
    });
    
    // Apply page level settings
    effectiveSettings = {
      ...effectiveSettings,
      ...pageMatches[0],
      source: 'page'
    };
  }
  
  return effectiveSettings;
};
