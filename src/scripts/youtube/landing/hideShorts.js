/**
 * Script to hide Shorts section on YouTube homepage
 */
export const execute = () => {
  console.log("Executing: Hide YouTube Shorts");
  
  // CSS to inject
  const css = `
    ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]) {
      display: none !important;
    }
    ytd-mini-guide-entry-renderer[aria-label*="Shorts"] {
      display: none !important;
    }
    ytd-guide-entry-renderer[title="Shorts"] {
      display: none !important;
    }
  `;
  
  // Inject the CSS
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
  
  // Also actively search and remove shorts sections
  const removeShorts = () => {
    // Find all section renderers
    const sections = document.querySelectorAll('ytd-rich-section-renderer');
    
    sections.forEach(section => {
      // Check if this section is a shorts section
      const shortsShelf = section.querySelector('ytd-rich-shelf-renderer[is-shorts]');
      if (shortsShelf) {
        section.style.display = 'none';
      }
    });
    
    // Hide shorts in sidebar
    const sidebarShorts = document.querySelectorAll('ytd-guide-entry-renderer[title="Shorts"], ytd-mini-guide-entry-renderer[aria-label*="Shorts"]');
    sidebarShorts.forEach(item => {
      item.style.display = 'none';
    });
  };
  
  // Run immediately
  removeShorts();
  
  // Set up observer to catch dynamically loaded content
  const observer = new MutationObserver(() => {
    removeShorts();
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Add visual indicator
  const badge = document.createElement("div");
  badge.textContent = "Shorts Hidden";
  badge.style.cssText = `
    position: fixed;
    top: 40px;
    left: 10px;
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
