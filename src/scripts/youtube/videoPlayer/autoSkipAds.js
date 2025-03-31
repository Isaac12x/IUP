/**
 * Script to automatically skip YouTube ads
 */
export const execute = () => {
  console.log("Executing: Auto Skip YouTube Ads");
  
  let adCount = 0;
  let badge = null;
  
  // Function to create or update badge
  const updateBadge = () => {
    if (!badge) {
      badge = document.createElement("div");
      badge.style.cssText = `
        position: fixed;
        top: 70px;
        right: 10px;
        background: #ff0000;
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 10000;
      `;
      document.body.appendChild(badge);
    }
    
    badge.textContent = `Ads Skipped: ${adCount}`;
  };
  
  // Function to check for and click skip ad button
  const skipAd = () => {
    // Check for skip button
    const skipButton = document.querySelector('.ytp-ad-skip-button');
    if (skipButton) {
      console.log("Ad skip button found, clicking...");
      skipButton.click();
      adCount++;
      updateBadge();
      return true;
    }
    
    // Check for "Skip Ads" button (multiple ads)
    const skipAdsButton = document.querySelector('.ytp-ad-skip-button-modern');
    if (skipAdsButton) {
      console.log("Skip Ads button found, clicking...");
      skipAdsButton.click();
      adCount++;
      updateBadge();
      return true;
    }
    
    return false;
  };
  
  // Create badge right away
  updateBadge();
  
  // Initialize skip check interval
  const checkInterval = setInterval(() => {
    skipAd();
  }, 1000);
  
  // Also observe DOM for changes to catch new ad elements
  const observer = new MutationObserver(() => {
    skipAd();
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  return { 
    success: true, 
    observer,
    cleanup: () => {
      clearInterval(checkInterval);
      observer.disconnect();
      if (badge && badge.parentNode) {
        badge.parentNode.removeChild(badge);
      }
    }
  };
};

export default execute;
