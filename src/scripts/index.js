// Scripts Registry organized by domain and page type
const SCRIPTS_REGISTRY = {
  youtube: {
    name: "YouTube",
    description: "Scripts for YouTube pages",
    pages: {
      landing: {
        name: "YouTube Home",
        urlPattern: /^https?:\/\/(www\.)?youtube\.com\/?$/,
        features: {
          hideSearch: {
            id: "youtube.landing.hideSuggestedVideos",
            name: "Hide Suggested Videos",
            description: "Hides suggested videos when navigating to the landing page",
            module: () => import('./youtube/landing/hideSuggested')
          },
          hideShorts: {
            id: "youtube.landing.hideShorts",
            name: "Hide Shorts",
            description: "Removes Shorts section from YouTube homepage",
            module: () => import('./youtube/landing/hideShorts')
          }
        }
      },
      player: {
        name: "YouTube Video Player",
        urlPattern: /^https?:\/\/(www\.)?youtube\.com\/watch\?v=.+/,
        features: {
          disableSuggestions: {
            id: "youtube.player.disableSuggestions",
            name: "Disable Suggested Videos",
            description: "Hides suggested videos on the player page",
            module: () => import('./youtube/videoPlayer/hideSuggestedVideos')
          },
          autoSkipAds: {
            id: "youtube.player.autoSkipAds",
            name: "Auto Skip Ads",
            description: "Automatically clicks 'Skip Ad' button when available",
            module: () => import('./youtube/videoPlayer/autoSkipAds')
          },
          collapseComments: {
            id: "youtube.player.collapseComments",
            name: "Collapse comments section",
            description: "Hides comments on video player by collapsing the section as a default",
            module: () => import('./youtube/videoPlayer/comments')
          },
          tldr: {
            id: "youtube.player.autoSkipAds",
            name: "Auto Skip Ads",
            description: "Summarizes the video and shows below the title.",
            module: () => import('./youtube/videoPlayer/tldr')
          },
          autoVideoTranscript: {
            id: "youtube.player.transcribeVideo",
            name: "Automatically transcribes videos",
            description: "Automatically trascribe videos when opening the video.",
            module: () => import('./youtube/videoPlayer/transcript')
          },
          autoVideoSummary: {
            id: "youtube.player.summarizeVideo",
            name: "Generates a summary of the video",
            description: "Automatically extracts a summary and other takeaways from the video",
            module: () => import('./youtube/videoPlayer/summarizeVideo')
          }
        }
      }
    }
  },
  google: {
    name: "Google",
    description: "Scripts for Google services",
    pages: {
      search: {
        name: "Google Search",
        urlPattern: /^https?:\/\/(www\.)?google\.[a-z]+\/search\?/,
        features: {
          hideAds: {
            id: "google.search.hideAds",
            name: "Hide Ads",
            description: "Removes ads from Google search results",
            module: () => import('./google/search/hideAds')
          },
          highlightResults: {
            id: "google.search.highlightResults",
            name: "Highlight Organic Results",
            description: "Highlights organic search results for better visibility",
            module: () => import('./google/search/highlightResults')
          }
        }
      }
    }
  },
  google: {
    name: "ChatGPT",
    description: "Scripts for ChatGPT services",
    pages: {
      chat: {
        name: "",
        urlPattern: /^https?:\/\/chatgpt\.com\/c\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/,
        features: {
          hideAds: {
            id: "chatgpt.chat.collapseResponseBubbles",
            name: "Collapses chat responses3",
            description: "Removes ads from Google search results",
            module: () => import('./google/search/hideAds')
          },
          highlightResults: {
            id: "google.search.highlightResults",
            name: "Highlight Organic Results",
            description: "Highlights organic search results for better visibility",
            module: () => import('./google/search/highlightResults')
          }
        }
      }
    }
  },
  globals: {
    name: "Globals",
    description: "Scripts for all websites",
    pages: {
      search: {
        name: "All websites",
        urlPattern: /^https?:\/\/\.+/,
        features: {
          hideAds: {
            id: "google.search.hideAds",
            name: "Hide Ads",
            description: "Removes ads from Google search results",
            module: () => import('./google/search/hideAds')
          },
          highlightResults: {
            id: "google.search.highlightResults",
            name: "Highlight Organic Results",
            description: "Highlights organic search results for better visibility",
            module: () => import('./google/search/highlightResults')
          }
        }
      }
    }
  }
  // Add more domains as needed
};

// Flatten the registry for easier access by ID
const flattenRegistry = () => {
  const flatScripts = {};
  
  // Iterate through domains
  Object.entries(SCRIPTS_REGISTRY).forEach(([domainKey, domain]) => {
    // Iterate through pages
    Object.entries(domain.pages).forEach(([pageKey, page]) => {
      // Iterate through features
      Object.entries(page.features).forEach(([featureKey, feature]) => {
        flatScripts[feature.id] = {
          ...feature,
          domainKey,
          pageKey,
          urlPattern: page.urlPattern
        };
      });
    });
  });
  
  return flatScripts;
};

const FLAT_REGISTRY = flattenRegistry();

// Get all available scripts grouped by domain/page
export const getAvailableScripts = () => {
  return SCRIPTS_REGISTRY;
};

// Get flat list of all scripts
export const getAllScriptsFlat = () => {
  return Object.values(FLAT_REGISTRY);
};

// Check if a URL matches a script's pattern
export const urlMatchesScript = (url, scriptId) => {
  const script = FLAT_REGISTRY[scriptId];
  return script && script.urlPattern.test(url);
};

// Get scripts applicable to a specific URL
export const getScriptsForUrl = (url) => {
  return Object.values(FLAT_REGISTRY)
    .filter(script => script.urlPattern.test(url))
    .map(script => script.id);
};

// Load and execute a script by ID
export const loadScript = async (scriptId) => {
  try {
    if (!FLAT_REGISTRY[scriptId]) {
      throw new Error(`Script "${scriptId}" not found in registry`);
    }
    
    // Dynamically import the module
    const scriptModule = await FLAT_REGISTRY[scriptId].module();
    
    // Most script modules will export an execute function
    const executeFunction = scriptModule.default || scriptModule.execute;
    
    if (typeof executeFunction !== 'function') {
      throw new Error(`Script "${scriptId}" does not export a valid execution function`);
    }
    
    // Execute the script
    return executeFunction();
  } catch (error) {
    console.error(`Error loading script "${scriptId}":`, error);
    throw error;
  }
};

export default SCRIPTS_REGISTRY;
