/**
 * Script to prevent duplicate tabs by checking if a tab with the same URL already exists
 */
export const execute = () => {
  console.log("Executing: Prevent Duplicate Tabs");

  // Listen for tab creation events
  chrome.tabs.onCreated.addListener(async (tab) => {
    // Skip if the tab doesn't have a URL yet
    if (!tab.url || tab.url === 'chrome://newtab/') return;

    try {
      // Get all tabs
      const tabs = await chrome.tabs.query({});
      
      // Find tabs with matching URLs (excluding the newly created tab)
      const duplicates = tabs.filter(t => 
        t.url === tab.url && t.id !== tab.id
      );

      // If duplicates found, close the new tab and focus the existing one
      if (duplicates.length > 0) {
        const existingTab = duplicates[0];
        
        // Focus the window containing the existing tab
        await chrome.windows.update(existingTab.windowId, { focused: true });
        
        // Focus the existing tab
        await chrome.tabs.update(existingTab.id, { active: true });
        
        // Close the duplicate tab
        await chrome.tabs.remove(tab.id);
        
        console.log(`Closed duplicate tab with URL: ${tab.url}`);
      }
    } catch (error) {
      console.error('Error handling duplicate tab:', error);
    }
  });

  return { success: true };
};

export default execute;
