/**
 * Script to disable suggested videos on YouTube player page
 */
export const execute = () => {
  console.log("Executing: Disable YouTube Suggested Videos");
  
  // CSS to inject
  const css = `
    .ytp-ce-element {
      display: none !important; /* Hide end screen suggestions */
    }
    .ytp-pause-overlay {
      display: none !important; /* Hide pause overlay suggestions */
    }
    .ytp-endscreen-content {
      display: none !important; /* Hide end screen content */
    }
    /* Hide related videos sidebar */
    #related {
      display: none !important;
    }
    #secondary {
      display: none !important;
    }
  `;
  
  // Inject the CSS
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  
  // Actively remove elements as they appear
  const removeSuggestions = () => {
    // End screen elements
    const endScreenElements = document.querySelectorAll('.ytp-ce-element, .ytp-pause-overlay, .ytp-endscreen-content');
    endScreenElements.forEach(el => {
      el.style.display = 'none';
    });
    
    // Related videos sidebar
    const related = document.getElementById('related');
    if (related) related.style.display = 'none';
    
    const secondary = document.getElementById('secondary');
    if (secondary) secondary.style.display = 'none';
  };
  
  // Run immediately
  removeSuggestions();
  
  // Set up observer to catch dynamically loaded content
  const observer = new MutationObserver(() => {
    removeSuggestions();
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Add visual indicator
  const badge = document.createElement("div");
  badge.textContent = "Suggestions Hidden";
  badge.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #ff0000;
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 12px;
    z-index: 10000;
    opacity: 0.8;
  `;
  document.body.appendChild(badge);
  
  // Clean up after 3 seconds
  setTimeout(() => {
    badge.style.opacity = '0';
    badge.style.transition = 'opacity 1s';
    
    setTimeout(() => {
      if (badge.parentNode) {
        badge.parentNode.removeChild(badge);
      }
    }, 1000);
  }, 3000);
  
  return { success: true, observer };
};

export default execute;
